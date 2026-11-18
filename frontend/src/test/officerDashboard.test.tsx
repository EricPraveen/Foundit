import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OfficerDashboardPage } from '@/pages/officer/OfficerDashboardPage';
import { officerService } from '@/features/officer/services/officerService';
import type { OfficerDashboardResponse } from '@/features/officer/types';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    getDashboard: vi.fn(),
  },
}));

describe('OfficerDashboardPage Component', () => {
  const mockDashboardData: OfficerDashboardResponse = {
    availableItems: 14,
    pendingHandovers: 3,
    pendingClaims: 5,
    pendingCollection: 2,
    returnedItems: 28,
    unclaimedItems: 1,
    activeLostReports: 7,
    officeId: 'office-uuid-1',
    officeName: 'Central Security Office - Premises Division',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <OfficerDashboardPage />
      </MemoryRouter>
    );
  };

  it('renders operational dashboard statistics correctly from backend API', async () => {
    vi.mocked(officerService.getDashboard).mockResolvedValue(mockDashboardData);

    renderDashboard();

    expect(screen.getByText(/Loading security office operational metrics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Security Officer Operational Console')).toBeInTheDocument();
    });

    // Office name badge
    expect(
      screen.getByText(/Central Security Office - Premises Division/i)
    ).toBeInTheDocument();

    // Verify key metrics displayed
    expect(screen.getByText('14')).toBeInTheDocument(); // Available Items
    expect(screen.getByText('3')).toBeInTheDocument(); // Pending Handovers
    expect(screen.getByText('5')).toBeInTheDocument(); // Pending Claims
    expect(screen.getByText('2')).toBeInTheDocument(); // Pending Collections
    expect(screen.getByText('28')).toBeInTheDocument(); // Returned Items
    expect(screen.getByText('7')).toBeInTheDocument(); // Active Lost Reports
    expect(screen.getByText('1')).toBeInTheDocument(); // Unclaimed Items

    // Triage Action Banner
    expect(screen.getByText('Triage Queue Action Required')).toBeInTheDocument();
  });

  it('handles backend API errors gracefully', async () => {
    vi.mocked(officerService.getDashboard).mockRejectedValue(
      new Error('Failed to connect to Central Security Office backend.')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Operational Data Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to connect to Central Security Office backend/i)
      ).toBeInTheDocument();
    });
  });

  it('refetches operational metrics when clicking refresh button', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.getDashboard).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('14')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh Metrics/i });
    await user.click(refreshButton);

    expect(officerService.getDashboard).toHaveBeenCalledTimes(2);
  });
});
