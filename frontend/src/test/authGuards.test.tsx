import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { ProtectedRoute, RoleRoute, PublicOnlyRoute } from '@/routes/guards';
import { ROUTES } from '@/routes/paths';
import type { User } from '@/types/auth';

describe('PublicOnlyRoute & Route Guards Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithAuth = (
    initialEntries: string[],
    initialUser: User | null = null,
    initialToken: string | null = null
  ) => {
    return render(
      <AuthProvider initialUser={initialUser} initialToken={initialToken}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            {/* Public-only routes */}
            <Route element={<PublicOnlyRoute />}>
              <Route path={ROUTES.PUBLIC.LOGIN} element={<div>Public Login Screen</div>} />
              <Route path={ROUTES.PUBLIC.REGISTER} element={<div>Public Register Screen</div>} />
            </Route>

            {/* Dashboards */}
            <Route path={ROUTES.APP.DASHBOARD} element={<div>Student Dashboard</div>} />
            <Route path={ROUTES.OFFICER.DASHBOARD} element={<div>Officer Dashboard</div>} />
            <Route path={ROUTES.ADMIN.DASHBOARD} element={<div>Admin Dashboard</div>} />
            <Route path={ROUTES.PUBLIC.UNAUTHORIZED} element={<div>Access Denied (403)</div>} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/student-area" element={<div>Protected Student Area</div>} />
            </Route>

            {/* Role Routes */}
            <Route element={<RoleRoute allowedRoles={['SECURITY_OFFICER']} />}>
              <Route path="/officer-restricted" element={<div>Officer Area</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('allows unauthenticated visitor to access login and register', () => {
    renderWithAuth([ROUTES.PUBLIC.LOGIN], null, null);
    expect(screen.getByText('Public Login Screen')).toBeInTheDocument();
  });

  it('redirects authenticated Student away from login to Student Dashboard', () => {
    const student: User = {
      id: 's-1',
      email: 'student@uom.lk',
      fullName: 'Student User',
      role: 'STUDENT',
    };

    renderWithAuth([ROUTES.PUBLIC.LOGIN], student, 'token');
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Public Login Screen')).not.toBeInTheDocument();
  });

  it('redirects authenticated Security Officer away from login to Officer Dashboard', () => {
    const officer: User = {
      id: 'o-1',
      email: 'officer@uom.lk',
      fullName: 'Officer User',
      role: 'SECURITY_OFFICER',
    };

    renderWithAuth([ROUTES.PUBLIC.LOGIN], officer, 'token');
    expect(screen.getByText('Officer Dashboard')).toBeInTheDocument();
  });

  it('redirects authenticated Super Admin away from login to Admin Dashboard', () => {
    const admin: User = {
      id: 'a-1',
      email: 'admin@uom.lk',
      fullName: 'Admin User',
      role: 'SUPER_ADMIN',
    };

    renderWithAuth([ROUTES.PUBLIC.LOGIN], admin, 'token');
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('blocks unauthenticated user from accessing protected student area', () => {
    renderWithAuth(['/student-area'], null, null);
    expect(screen.getByText('Public Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Student Area')).not.toBeInTheDocument();
  });

  it('blocks student from accessing officer-only route and redirects to unauthorized', () => {
    const student: User = {
      id: 's-1',
      email: 'student@uom.lk',
      fullName: 'Student User',
      role: 'STUDENT',
    };

    renderWithAuth(['/officer-restricted'], student, 'token');
    expect(screen.getByText('Access Denied (403)')).toBeInTheDocument();
    expect(screen.queryByText('Officer Area')).not.toBeInTheDocument();
  });
});
