import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/app/App';
import { tokenStorage } from '@/lib/api/tokenStorage';

describe('App Root', () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStorage.clearAccessToken();
  });

  it('renders root application with CampusFind branding', async () => {
    render(<App />);

    expect(await screen.findByText('CampusFind')).toBeInTheDocument();
    expect(
      await screen.findByText(/Lost something on campus\?/i)
    ).toBeInTheDocument();
  });
});
