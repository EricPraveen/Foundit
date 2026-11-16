import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/features/auth';
import { tokenStorage } from '@/lib/api/tokenStorage';
import type { User } from '@/types/auth';

const TestAuthConsumer: React.FC = () => {
  const { isAuthenticated, user, token, login, logout, hasRole } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'anonymous'}</div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <div data-testid="user-role">{user?.role || 'none'}</div>
      <div data-testid="token-val">{token || 'none'}</div>
      <div data-testid="has-student-role">{hasRole('STUDENT') ? 'yes' : 'no'}</div>
      <div data-testid="has-officer-role">{hasRole('SECURITY_OFFICER') ? 'yes' : 'no'}</div>
      <button
        onClick={() =>
          login({
            accessToken: 'sample-jwt',
            tokenType: 'Bearer',
            expiresIn: 86400,
            user: {
              id: 'u-1',
              email: 'student@uom.lk',
              fullName: 'Sample Student',
              role: 'STUDENT',
            },
          })
        }
      >
        Trigger Login
      </button>
      <button onClick={logout}>Trigger Logout</button>
    </div>
  );
};

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStorage.clearAccessToken();
  });

  it('provides anonymous default state when unauthenticated', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    expect(screen.getByTestId('token-val')).toHaveTextContent('none');
    expect(screen.getByTestId('has-student-role')).toHaveTextContent('no');
  });

  it('updates state upon login and logout', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText('Trigger Login'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('student@uom.lk');
    expect(screen.getByTestId('user-role')).toHaveTextContent('STUDENT');
    expect(screen.getByTestId('token-val')).toHaveTextContent('sample-jwt');
    expect(screen.getByTestId('has-student-role')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-officer-role')).toHaveTextContent('no');

    await user.click(screen.getByText('Trigger Logout'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    expect(screen.getByTestId('token-val')).toHaveTextContent('none');
  });

  it('initializes with custom initialUser for testing or rehydration', () => {
    const mockUser: User = {
      id: 'officer-1',
      email: 'officer@uom.lk',
      fullName: 'Chief Officer',
      role: 'SECURITY_OFFICER',
    };

    render(
      <AuthProvider initialUser={mockUser} initialToken="persisted-token">
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-role')).toHaveTextContent('SECURITY_OFFICER');
    expect(screen.getByTestId('has-officer-role')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-student-role')).toHaveTextContent('no');
  });
});
