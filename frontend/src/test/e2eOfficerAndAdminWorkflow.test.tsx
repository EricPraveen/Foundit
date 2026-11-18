import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OfficerDashboardPage } from '@/pages/officer/OfficerDashboardPage';
import { OfficerHandoversPage } from '@/pages/officer/OfficerHandoversPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { officerService } from '@/features/officer/services/officerService';
import { adminService } from '@/features/admin/services/adminService';
import { AuthProvider } from '@/features/auth';
import type { OfficerDashboardResponse, FoundItemResponse } from '@/features/officer/types';
import type { AdminDashboardMetrics } from '@/features/admin/types';
import type { Page } from '@/types/api';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    getDashboard: vi.fn(),
    getPendingHandovers: vi.fn(),
    getOverdueHandovers: vi.fn(),
    confirmHandover: vi.fn(),
  },
}));

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getDashboardMetrics: vi.fn(),
  },
}));

describe('Workflow Verification: Officer & Super Admin Operational Journeys', () => {
  const officerUser = {
    id: 'officer-1',
    email: 'officer.suneth@uom.lk',
    fullName: 'Officer Suneth',
    role: 'SECURITY_OFFICER' as const,
  };

  const adminUser = {
    id: 'admin-1',
    email: 'admin@uom.lk',
    fullName: 'System Administrator',
    role: 'SUPER_ADMIN' as const,
  };

  const mockOfficerStats: OfficerDashboardResponse = {
    officeId: 'office-1',
    officeName: 'Central Security Office',
    pendingHandovers: 3,
    pendingClaims: 2,
    pendingCollection: 1,
    availableItems: 12,
    returnedItems: 45,
    unclaimedItems: 0,
    activeLostReports: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Officer Operations: Dashboard metrics and operational navigation verification', async () => {
    vi.mocked(officerService.getDashboard).mockResolvedValue(mockOfficerStats);

    render(
      <AuthProvider initialUser={officerUser} initialToken="token-officer">
        <MemoryRouter initialEntries={['/officer/dashboard']}>
          <Routes>
            <Route path="/officer/dashboard" element={<OfficerDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Verify operational metrics and dashboard cards rendered
    await waitFor(() => {
      expect(screen.getByText('Security Officer Operational Console')).toBeInTheDocument();
    });

    expect(screen.getByText(/Central Security Office/i)).toBeInTheDocument();
    expect(screen.getByText('Physical Handover Verification')).toBeInTheDocument();
    expect(screen.getByText('Ownership Claims Review')).toBeInTheDocument();
    expect(screen.getByText('Pending Physical Collections')).toBeInTheDocument();
  });

  it('Officer Operations: Confirm physical handover receipt with logbook remarks', async () => {
    const pendingItem: FoundItemResponse = {
      id: 'item-301',
      title: 'HP Pavilion Laptop Blue',
      description: 'Found under desk B-14',
      categoryId: 'cat-1',
      categoryName: 'Electronics & Devices',
      locationId: 'loc-1',
      locationName: 'Main Library 2nd Floor',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'PENDING',
      availabilityStatus: 'UNAVAILABLE',
      foundAt: '2026-11-18T08:00:00Z',
      createdAt: '2026-11-18T08:00:00Z',
      updatedAt: '2026-11-18T08:00:00Z',
      finderName: 'Kasun Bandara',
      images: [],
      handoverConfirmedAt: null,
    };

    const mockPendingPage: Page<FoundItemResponse> = {
      content: [pendingItem],
      totalElements: 1,
      totalPages: 1,
      size: 15,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(officerService.getPendingHandovers).mockResolvedValue(mockPendingPage);
    vi.mocked(officerService.getOverdueHandovers).mockResolvedValue([]);
    vi.mocked(officerService.confirmHandover).mockResolvedValue({
      ...pendingItem,
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'AVAILABLE',
      handoverConfirmedAt: '2026-11-18T08:30:00Z',
    });

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={officerUser} initialToken="token-officer">
        <MemoryRouter initialEntries={['/officer/handovers']}>
          <Routes>
            <Route path="/officer/handovers" element={<OfficerHandoversPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('HP Pavilion Laptop Blue')).toBeInTheDocument();
    });

    // Open confirm handover receipt modal
    const confirmBtn = screen.getByRole('button', { name: /Confirm Physical Receipt/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm Physical Handover')).toBeInTheDocument();
    });

    // Fill officer custody notes
    const remarksInput = screen.getByPlaceholderText(/e\.g\. Received in good condition, stored in Safe Bin #4/i);
    await user.type(remarksInput, 'Checked charger and laptop serial number. Logbook entry #88.');

    const submitConfirmBtn = screen.getByRole('button', { name: /^Confirm Receipt & Make Available$/i });
    await user.click(submitConfirmBtn);

    await waitFor(() => {
      expect(officerService.confirmHandover).toHaveBeenCalledWith(
        'item-301',
        expect.objectContaining({
          officerNotes: 'Checked charger and laptop serial number. Logbook entry #88.',
        })
      );
    });
  });

  it('Super Admin Operations: Admin dashboard aggregate counts and operational governance', async () => {
    const adminMetrics: AdminDashboardMetrics = {
      totalUsers: 142,
      activeUsers: 138,
      totalOfficers: 6,
      totalCategories: 12,
      totalLocations: 18,
      availableItems: 12,
      pendingHandovers: 3,
      pendingClaims: 2,
      pendingCollection: 1,
      returnedItems: 45,
      unclaimedItems: 0,
      activeLostReports: 5,
    };

    vi.mocked(adminService.getDashboardMetrics).mockResolvedValue(adminMetrics);

    render(
      <AuthProvider initialUser={adminUser} initialToken="token-admin">
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('System Administration')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'User Governance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Security Officers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Category Management' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Campus Locations' })).toBeInTheDocument();
  });
});
