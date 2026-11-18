import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { adminService } from '@/features/admin/services/adminService';
import type { AdminDashboardMetrics } from '@/features/admin/types';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getDashboardMetrics: vi.fn(),
  },
}));

describe('AdminDashboardPage Component', () => {
  const mockMetrics: AdminDashboardMetrics = {
    totalUsers: 48,
    activeUsers: 42,
    totalOfficers: 4,
    totalCategories: 8,
    totalLocations: 12,
    availableItems: 15,
    pendingHandovers: 3,
    pendingClaims: 2,
    pendingCollection: 1,
    returnedItems: 10,
    unclaimedItems: 0,
    activeLostReports: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders operational metrics and administrative counts accurately from service', async () => {
    vi.mocked(adminService.getDashboardMetrics).mockResolvedValue(mockMetrics);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('System Administration')).toBeInTheDocument();
    });

    // Identity & platform metrics
    expect(screen.getByText('48')).toBeInTheDocument(); // totalUsers
    expect(screen.getByText('42 active accounts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // totalOfficers
    expect(screen.getByText('8')).toBeInTheDocument(); // totalCategories
    expect(screen.getByText('12')).toBeInTheDocument(); // totalLocations

    // Custody metrics
    expect(screen.getByText('15')).toBeInTheDocument(); // availableItems
    expect(screen.getByText('3')).toBeInTheDocument(); // pendingHandovers
    expect(screen.getByText('2')).toBeInTheDocument(); // pendingClaims
    expect(screen.getByText('1')).toBeInTheDocument(); // pendingCollection
    expect(screen.getByText('10')).toBeInTheDocument(); // returnedItems
  });

  it('renders navigation cards to administrative modules', async () => {
    vi.mocked(adminService.getDashboardMetrics).mockResolvedValue(mockMetrics);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User Governance')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Manage Officers')).toBeInTheDocument();
    expect(screen.getByText('Manage Categories')).toBeInTheDocument();
    expect(screen.getByText('Manage Locations')).toBeInTheDocument();
    expect(screen.getByText('Calibrate Rules')).toBeInTheDocument();
    expect(screen.getByText('View System Policies')).toBeInTheDocument();
    expect(screen.getByText('Inspect Audit Logs')).toBeInTheDocument();
  });

  it('displays error alert when dashboard aggregate API fails', async () => {
    vi.mocked(adminService.getDashboardMetrics).mockRejectedValue(
      new Error('Failed to connect to backend cluster')
    );

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to Load Operational Statistics/i)
      ).toBeInTheDocument();
    });
  });
});
