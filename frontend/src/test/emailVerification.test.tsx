import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VerifyEmailPage } from '@/pages/public/VerifyEmailPage';
import { authService } from '@/features/auth';
import { ApiError } from '@/lib/api';

describe('VerifyEmailPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithUrl = (url: string) => {
    return render(
      <MemoryRouter initialEntries={[url]}>
        <VerifyEmailPage />
      </MemoryRouter>
    );
  };

  it('automatically verifies token when token query parameter is present in URL', async () => {
    const verifySpy = vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      message: 'Email successfully verified! You may now log in to Foundit.',
    });

    renderWithUrl('/verify-email?token=valid-secret-token');

    expect(verifySpy).toHaveBeenCalledWith('valid-secret-token');
    expect(await screen.findByText('Account Activated!')).toBeInTheDocument();
    expect(
      screen.getByText('Email successfully verified! You may now log in to Foundit.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proceed to Log In/i })).toBeInTheDocument();
  });

  it('displays backend error message when verification token is expired or invalid', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError({
        message: 'Verification token has expired. Please request a new verification link.',
        status: 400,
        error: 'Bad Request',
      })
    );

    renderWithUrl('/verify-email?token=expired-token');

    expect(
      await screen.findByText(
        'Verification token has expired. Please request a new verification link.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Verification Failed/i)).toBeInTheDocument();
  });

  it('allows manual token submission when visiting without query parameters', async () => {
    const user = userEvent.setup();
    const verifySpy = vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      message: 'Email successfully verified! You may now log in to Foundit.',
    });

    renderWithUrl('/verify-email');

    const input = screen.getByPlaceholderText('Paste verification token');
    await user.type(input, 'manually-pasted-token');

    const verifyBtn = screen.getByRole('button', { name: 'Verify' });
    await user.click(verifyBtn);

    expect(verifySpy).toHaveBeenCalledWith('manually-pasted-token');
    expect(await screen.findByText('Account Activated!')).toBeInTheDocument();
  });

  it('handles resending verification link with valid @uom.lk email', async () => {
    const user = userEvent.setup();
    const resendSpy = vi.spyOn(authService, 'resendVerification').mockResolvedValueOnce({
      message: 'If an unverified account exists for this email, a new verification link has been sent.',
    });

    renderWithUrl('/verify-email');

    const emailInput = screen.getByPlaceholderText('username@uom.lk');
    await user.type(emailInput, 'student@uom.lk');

    const resendBtn = screen.getByRole('button', { name: /Send New Verification Link/i });
    await user.click(resendBtn);

    expect(resendSpy).toHaveBeenCalledWith('student@uom.lk');
    expect(
      await screen.findByText(
        'If an unverified account exists for this email, a new verification link has been sent.'
      )
    ).toBeInTheDocument();
  });

  it('validates email domain on resend verification form', async () => {
    const user = userEvent.setup();
    const resendSpy = vi.spyOn(authService, 'resendVerification');

    renderWithUrl('/verify-email');

    const emailInput = screen.getByPlaceholderText('username@uom.lk');
    await user.type(emailInput, 'student@gmail.com');

    const resendBtn = screen.getByRole('button', { name: /Send New Verification Link/i });
    await user.click(resendBtn);

    expect(
      await screen.findByText('Must be an official @uom.lk university email.')
    ).toBeInTheDocument();
    expect(resendSpy).not.toHaveBeenCalled();
  });
});
