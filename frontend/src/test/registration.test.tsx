import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { authService } from '@/features/auth';
import { ApiError } from '@/lib/api';

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderRegister = () => {
    return render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  };

  it('renders all registration form fields and submit button', () => {
    renderRegister();

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/University Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('validates required fields on client side before API call', async () => {
    const user = userEvent.setup();
    const registerSpy = vi.spyOn(authService, 'register');
    renderRegister();

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(await screen.findByText('University email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('rejects non-@uom.lk domains with specific client error message', async () => {
    const user = userEvent.setup();
    const registerSpy = vi.spyOn(authService, 'register');
    renderRegister();

    await user.type(screen.getByLabelText(/Full Name/i), 'Kasun Perera');
    await user.type(screen.getByLabelText(/University Email Address/i), 'kasun@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'SecurePass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByText(/Registration requires an official @uom.lk email/i)
    ).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('rejects subdomain lookalikes (@student.uom.lk)', async () => {
    const user = userEvent.setup();
    const registerSpy = vi.spyOn(authService, 'register');
    renderRegister();

    await user.type(screen.getByLabelText(/Full Name/i), 'Kasun Perera');
    await user.type(screen.getByLabelText(/University Email Address/i), 'kasun@student.uom.lk');
    await user.type(screen.getByLabelText('Password'), 'SecurePass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByText(/Registration requires an official @uom.lk email/i)
    ).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('validates password minimum length (>= 8 chars)', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Full Name/i), 'Kasun Perera');
    await user.type(screen.getByLabelText(/University Email Address/i), 'kasun@uom.lk');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByText('Password must be at least 8 characters long')
    ).toBeInTheDocument();
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/Full Name/i), 'Kasun Perera');
    await user.type(screen.getByLabelText(/University Email Address/i), 'kasun@uom.lk');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPassword456');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderRegister();

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText('Show password visibility');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByLabelText('Hide password visibility'));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits valid form and displays success screen instructing user to check university inbox', async () => {
    const user = userEvent.setup();
    const registerSpy = vi.spyOn(authService, 'register').mockResolvedValueOnce({
      message: 'Registration successful. Please check your @uom.lk inbox to verify your account.',
    });

    renderRegister();

    await user.type(screen.getByLabelText(/Full Name/i), 'Kasun Perera');
    await user.type(screen.getByLabelText(/University Email Address/i), 'kasun.p@uom.lk');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(registerSpy).toHaveBeenCalledWith({
      fullName: 'Kasun Perera',
      email: 'kasun.p@uom.lk',
      password: 'StrongPass123',
    });

    expect(await screen.findByText('Check Your University Inbox')).toBeInTheDocument();
    expect(screen.getByText('kasun.p@uom.lk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to Log In/i })).toBeInTheDocument();
  });

  it('displays error message when backend responds with 409 Conflict (duplicate email)', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'register').mockRejectedValueOnce(
      new ApiError({
        message: 'An account with this email address is already registered.',
        status: 409,
        error: 'Conflict',
      })
    );

    renderRegister();

    await user.type(screen.getByLabelText(/Full Name/i), 'Kasun Perera');
    await user.type(screen.getByLabelText(/University Email Address/i), 'existing@uom.lk');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123');

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(
      await screen.findByText('An account with this email address is already registered.')
    ).toBeInTheDocument();
    expect(screen.getByText('This email is already in use.')).toBeInTheDocument();
  });
});
