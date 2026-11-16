import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/pages/public/LoginPage';
import { AuthProvider, authService } from '@/features/auth';
import { ROUTES } from '@/routes/paths';
import { ApiError } from '@/lib/api';
import type { AuthResponse } from '@/types/auth';

describe('LoginPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderLogin = (initialEntries = [ROUTES.PUBLIC.LOGIN], initialEntryState?: unknown) => {
    const memoryEntries = initialEntryState
      ? [{ pathname: initialEntries[0], state: initialEntryState }]
      : initialEntries;

    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={memoryEntries}>
          <Routes>
            <Route path={ROUTES.PUBLIC.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.APP.DASHBOARD} element={<div>Student Dashboard View</div>} />
            <Route path={ROUTES.OFFICER.DASHBOARD} element={<div>Officer Dashboard View</div>} />
            <Route path={ROUTES.ADMIN.DASHBOARD} element={<div>Admin Dashboard View</div>} />
            <Route path="/target-page" element={<div>Original Target Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('renders login form elements', () => {
    renderLogin();

    expect(screen.getByLabelText(/University Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Log In$/i })).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('validates required fields on client side', async () => {
    const user = userEvent.setup();
    const loginSpy = vi.spyOn(authService, 'login');

    renderLogin();

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(await screen.findByText('University email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('validates university domain (@uom.lk) format', async () => {
    const user = userEvent.setup();
    const loginSpy = vi.spyOn(authService, 'login');

    renderLogin();

    await user.type(screen.getByLabelText(/University Email/i), 'user@gmail.com');
    await user.type(screen.getByLabelText(/^Password/i), 'SecretPass123');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(
      await screen.findByText('Please enter an official @uom.lk university email')
    ).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('displays error on 401 Unauthorized (invalid credentials)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new ApiError({
        message: 'Invalid email or password.',
        status: 401,
        error: 'Unauthorized',
      })
    );

    renderLogin();

    await user.type(screen.getByLabelText(/University Email/i), 'student@uom.lk');
    await user.type(screen.getByLabelText(/^Password/i), 'WrongPassword');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(
      await screen.findByText(/Invalid email or password\. Please verify your credentials and try again\./i)
    ).toBeInTheDocument();
  });

  it('displays activation guidance on 403 Forbidden (unverified account)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new ApiError({
        message: 'Account email is not verified. Please verify your @uom.lk email before logging in.',
        status: 403,
        error: 'Forbidden',
      })
    );

    renderLogin();

    await user.type(screen.getByLabelText(/University Email/i), 'unverified@uom.lk');
    await user.type(screen.getByLabelText(/^Password/i), 'Password123');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(
      await screen.findByText(/Account email is not verified\. Please verify your @uom.lk email before logging in\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Click here to activate your account or resend your verification link/i)
    ).toBeInTheDocument();
  });

  it('successfully logs in Student and navigates to Student Dashboard', async () => {
    const user = userEvent.setup();
    const mockAuthResponse: AuthResponse = {
      accessToken: 'sample-student-jwt',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 's-1',
        email: 'student@uom.lk',
        fullName: 'Jane Student',
        role: 'STUDENT',
      },
    };

    vi.spyOn(authService, 'login').mockResolvedValueOnce(mockAuthResponse);

    renderLogin();

    await user.type(screen.getByLabelText(/University Email/i), 'student@uom.lk');
    await user.type(screen.getByLabelText(/^Password/i), 'CorrectPassword123');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(await screen.findByText('Student Dashboard View')).toBeInTheDocument();
  });

  it('successfully logs in Security Officer and navigates to Officer Dashboard', async () => {
    const user = userEvent.setup();
    const mockAuthResponse: AuthResponse = {
      accessToken: 'sample-officer-jwt',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 'o-1',
        email: 'officer@uom.lk',
        fullName: 'Chief Officer',
        role: 'SECURITY_OFFICER',
      },
    };

    vi.spyOn(authService, 'login').mockResolvedValueOnce(mockAuthResponse);

    renderLogin();

    await user.type(screen.getByLabelText(/University Email/i), 'officer@uom.lk');
    await user.type(screen.getByLabelText(/^Password/i), 'CorrectPassword123');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(await screen.findByText('Officer Dashboard View')).toBeInTheDocument();
  });

  it('successfully logs in Super Admin and navigates to Admin Dashboard', async () => {
    const user = userEvent.setup();
    const mockAuthResponse: AuthResponse = {
      accessToken: 'sample-admin-jwt',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 'a-1',
        email: 'admin@uom.lk',
        fullName: 'System Admin',
        role: 'SUPER_ADMIN',
      },
    };

    vi.spyOn(authService, 'login').mockResolvedValueOnce(mockAuthResponse);

    renderLogin();

    await user.type(screen.getByLabelText(/University Email/i), 'admin@uom.lk');
    await user.type(screen.getByLabelText(/^Password/i), 'CorrectPassword123');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(await screen.findByText('Admin Dashboard View')).toBeInTheDocument();
  });

  it('redirects to original target page when login was triggered from a protected route', async () => {
    const user = userEvent.setup();
    const mockAuthResponse: AuthResponse = {
      accessToken: 'sample-jwt',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 's-1',
        email: 'student@uom.lk',
        fullName: 'Student User',
        role: 'STUDENT',
      },
    };

    vi.spyOn(authService, 'login').mockResolvedValueOnce(mockAuthResponse);

    renderLogin([ROUTES.PUBLIC.LOGIN], { from: { pathname: '/target-page' } });

    expect(screen.getByText(/You must log in to access/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/University Email/i), 'student@uom.lk');
    await user.type(screen.getByLabelText(/^Password/i), 'Password123');

    await user.click(screen.getByRole('button', { name: /^Log In$/i }));

    expect(await screen.findByText('Original Target Page')).toBeInTheDocument();
  });
});
