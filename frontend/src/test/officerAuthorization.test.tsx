import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { RoleRoute } from '@/routes/guards';
import { ROUTES } from '@/routes/paths';
import type { User } from '@/types/auth';

describe('Officer Route Protection & Authorization', () => {
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
            <Route path={ROUTES.PUBLIC.LOGIN} element={<div>Login Page</div>} />
            <Route path={ROUTES.PUBLIC.UNAUTHORIZED} element={<div>Access Denied (403)</div>} />

            {/* Officer Portal Guarded Routes */}
            <Route element={<RoleRoute allowedRoles={['SECURITY_OFFICER']} />}>
              <Route path={ROUTES.OFFICER.DASHBOARD} element={<div>Officer Dashboard Content</div>} />
              <Route path={ROUTES.OFFICER.HANDOVERS} element={<div>Officer Handovers Content</div>} />
              <Route path={ROUTES.OFFICER.FOUND_ITEMS} element={<div>Officer Inventory Content</div>} />
              <Route path={ROUTES.OFFICER.LOST_REPORTS} element={<div>Officer Lost Reports Content</div>} />
              <Route path={ROUTES.OFFICER.CLAIMS} element={<div>Officer Claims Content</div>} />
              <Route path={ROUTES.OFFICER.COLLECTIONS} element={<div>Officer Collections Content</div>} />
              <Route path={ROUTES.OFFICER.RETURNED_ITEMS} element={<div>Officer Returned Items Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('redirects unauthenticated user trying to access officer dashboard to login', () => {
    renderWithAuth([ROUTES.OFFICER.DASHBOARD], null, null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Officer Dashboard Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user trying to access officer handovers to login', () => {
    renderWithAuth([ROUTES.OFFICER.HANDOVERS], null, null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('blocks student from accessing officer portal and redirects to unauthorized page', () => {
    const studentUser: User = {
      id: 's-101',
      email: 'student@uom.lk',
      fullName: 'Kamal Perera',
      role: 'STUDENT',
    };

    renderWithAuth([ROUTES.OFFICER.DASHBOARD], studentUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied (403)')).toBeInTheDocument();
    expect(screen.queryByText('Officer Dashboard Content')).not.toBeInTheDocument();
  });

  it('blocks student from accessing officer claims and redirects to unauthorized page', () => {
    const studentUser: User = {
      id: 's-101',
      email: 'student@uom.lk',
      fullName: 'Kamal Perera',
      role: 'STUDENT',
    };

    renderWithAuth([ROUTES.OFFICER.CLAIMS], studentUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied (403)')).toBeInTheDocument();
    expect(screen.queryByText('Officer Claims Content')).not.toBeInTheDocument();
  });

  it('blocks super admin from accessing officer-only portal routes directly', () => {
    const adminUser: User = {
      id: 'admin-1',
      email: 'admin@uom.lk',
      fullName: 'Chief Administrator',
      role: 'SUPER_ADMIN',
    };

    renderWithAuth([ROUTES.OFFICER.DASHBOARD], adminUser, 'mock-jwt-token');
    expect(screen.getByText('Access Denied (403)')).toBeInTheDocument();
    expect(screen.queryByText('Officer Dashboard Content')).not.toBeInTheDocument();
  });

  it('allows authenticated Security Officer to access officer dashboard', () => {
    const officerUser: User = {
      id: 'officer-1',
      email: 'officer@uom.lk',
      fullName: 'Sergeant Fernando',
      role: 'SECURITY_OFFICER',
    };

    renderWithAuth([ROUTES.OFFICER.DASHBOARD], officerUser, 'mock-jwt-token');
    expect(screen.getByText('Officer Dashboard Content')).toBeInTheDocument();
  });

  it('allows authenticated Security Officer to access officer claims desk', () => {
    const officerUser: User = {
      id: 'officer-1',
      email: 'officer@uom.lk',
      fullName: 'Sergeant Fernando',
      role: 'SECURITY_OFFICER',
    };

    renderWithAuth([ROUTES.OFFICER.CLAIMS], officerUser, 'mock-jwt-token');
    expect(screen.getByText('Officer Claims Content')).toBeInTheDocument();
  });

  it('allows authenticated Security Officer to access officer collections queue', () => {
    const officerUser: User = {
      id: 'officer-1',
      email: 'officer@uom.lk',
      fullName: 'Sergeant Fernando',
      role: 'SECURITY_OFFICER',
    };

    renderWithAuth([ROUTES.OFFICER.COLLECTIONS], officerUser, 'mock-jwt-token');
    expect(screen.getByText('Officer Collections Content')).toBeInTheDocument();
  });
});
