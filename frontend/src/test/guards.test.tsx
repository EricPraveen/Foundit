import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { RoleRoute } from '@/routes/guards/RoleRoute';
import { ROUTES } from '@/routes/paths';
import type { User } from '@/types/auth';

describe('Route Guards', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithRouter = (
    initialEntries: string[],
    initialUser: User | null = null,
    initialToken: string | null = null
  ) => {
    return render(
      <AuthProvider initialUser={initialUser} initialToken={initialToken}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={ROUTES.PUBLIC.LOGIN} element={<div>Login Page</div>} />
            <Route path={ROUTES.PUBLIC.UNAUTHORIZED} element={<div>Unauthorized Page</div>} />

            {/* Protected Route test */}
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Protected Secret Content</div>} />
            </Route>

            {/* Officer Role Route test */}
            <Route
              element={
                <RoleRoute allowedRoles={['SECURITY_OFFICER', 'SUPER_ADMIN']}>
                  <div>Officer Console Content</div>
                </RoleRoute>
              }
            >
              <Route path="/officer-area" element={<div>Officer Inner</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('redirects unauthenticated user to login when accessing protected route', () => {
    renderWithRouter(['/protected'], null, null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Secret Content')).not.toBeInTheDocument();
  });

  it('allows authenticated user to view protected route', () => {
    const studentUser: User = {
      id: 's-1',
      email: 'student@uom.lk',
      fullName: 'Student One',
      role: 'STUDENT',
    };

    renderWithRouter(['/protected'], studentUser, 'valid-token');
    expect(screen.getByText('Protected Secret Content')).toBeInTheDocument();
  });

  it('redirects user with insufficient role to unauthorized page', () => {
    const studentUser: User = {
      id: 's-1',
      email: 'student@uom.lk',
      fullName: 'Student One',
      role: 'STUDENT',
    };

    renderWithRouter(['/officer-area'], studentUser, 'valid-token');
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    expect(screen.queryByText('Officer Console Content')).not.toBeInTheDocument();
  });

  it('allows user with authorized role to view role-restricted route', () => {
    const officerUser: User = {
      id: 'o-1',
      email: 'officer@uom.lk',
      fullName: 'Security Officer',
      role: 'SECURITY_OFFICER',
    };

    renderWithRouter(['/officer-area'], officerUser, 'valid-token');
    expect(screen.getByText('Officer Console Content')).toBeInTheDocument();
  });
});
