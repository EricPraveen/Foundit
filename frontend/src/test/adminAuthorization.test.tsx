import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { RoleRoute } from '@/routes/guards';
import { ROUTES } from '@/routes/paths';
import type { User } from '@/types/auth';

describe('Super Admin Route Protection & Authorization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithAuth = (
    initialEntries: string[],
    user: User | null = null,
    token: string | null = null
  ) => {
    return render(
      <AuthProvider initialUser={user} initialToken={token}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={ROUTES.PUBLIC.LOGIN} element={<div>Login Page Guard</div>} />
            <Route path={ROUTES.PUBLIC.UNAUTHORIZED} element={<div>Access Denied Page</div>} />
            <Route
              path={ROUTES.ADMIN.ROOT}
              element={
                <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                  <div>
                    Admin Outlet Wrapper
                    <Outlet />
                  </div>
                </RoleRoute>
              }
            >
              <Route path="dashboard" element={<div>Admin Dashboard Protected</div>} />
              <Route path="users" element={<div>Admin Users Protected</div>} />
              <Route path="officers" element={<div>Admin Officers Protected</div>} />
              <Route path="categories" element={<div>Admin Categories Protected</div>} />
              <Route path="locations" element={<div>Admin Locations Protected</div>} />
              <Route path="reputation-rules" element={<div>Admin Reputation Protected</div>} />
              <Route path="system-config" element={<div>Admin System Config Protected</div>} />
              <Route path="audit-logs" element={<div>Admin Audit Logs Protected</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('redirects unauthenticated user navigating to admin dashboard to login', () => {
    renderWithAuth(['/admin/dashboard'], null, null);
    expect(screen.getByText('Login Page Guard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard Protected')).not.toBeInTheDocument();
  });

  it('blocks student user from accessing admin dashboard directly', () => {
    const studentUser: User = {
      id: 'student-1',
      email: 'student@uom.lk',
      fullName: 'Chamath Perera',
      role: 'STUDENT',
    };

    renderWithAuth(['/admin/dashboard'], studentUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard Protected')).not.toBeInTheDocument();
  });

  it('blocks student user from accessing admin user governance directly', () => {
    const studentUser: User = {
      id: 'student-1',
      email: 'student@uom.lk',
      fullName: 'Chamath Perera',
      role: 'STUDENT',
    };

    renderWithAuth(['/admin/users'], studentUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Users Protected')).not.toBeInTheDocument();
  });

  it('blocks security officer user from accessing admin dashboard directly', () => {
    const officerUser: User = {
      id: 'officer-1',
      email: 'officer@uom.lk',
      fullName: 'Officer Kamal',
      role: 'SECURITY_OFFICER',
    };

    renderWithAuth(['/admin/dashboard'], officerUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard Protected')).not.toBeInTheDocument();
  });

  it('blocks security officer from accessing admin categories or audit logs directly', () => {
    const officerUser: User = {
      id: 'officer-1',
      email: 'officer@uom.lk',
      fullName: 'Officer Kamal',
      role: 'SECURITY_OFFICER',
    };

    renderWithAuth(['/admin/audit-logs'], officerUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Audit Logs Protected')).not.toBeInTheDocument();
  });

  it('allows authenticated Super Admin user to access admin dashboard', () => {
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@uom.lk',
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
    };

    renderWithAuth(['/admin/dashboard'], adminUser, 'mock-admin-token');
    expect(screen.getByText('Admin Dashboard Protected')).toBeInTheDocument();
  });

  it('allows authenticated Super Admin user to access admin users page', () => {
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@uom.lk',
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
    };

    renderWithAuth(['/admin/users'], adminUser, 'mock-admin-token');
    expect(screen.getByText('Admin Users Protected')).toBeInTheDocument();
  });

  it('allows authenticated Super Admin user to access system audit logs', () => {
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@uom.lk',
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
    };

    renderWithAuth(['/admin/audit-logs'], adminUser, 'mock-admin-token');
    expect(screen.getByText('Admin Audit Logs Protected')).toBeInTheDocument();
  });
});
