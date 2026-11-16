import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';

describe('ForgotPasswordPage Component', () => {
  it('renders institutional assistance guidance without simulating fake success', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Password Recovery')).toBeInTheDocument();
    expect(screen.getByText(/Self-Service Recovery Pending/i)).toBeInTheDocument();
    expect(screen.getByText(/In-Person Assistance/i)).toBeInTheDocument();
    expect(screen.getByText(/Administrative Support/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Login/i })).toBeInTheDocument();
  });
});
