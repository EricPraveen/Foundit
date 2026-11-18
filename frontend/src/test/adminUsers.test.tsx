import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from '@/pages/admin/AdminUserDetailPage';
import { adminService } from '@/features/admin/services/adminService';
import type { AdminUserResponse } from '@/features/admin/types';
import type { Page } from '@/types/api';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUserStatus: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

describe('Admin User Governance', () => {
  const mockUsers: AdminUserResponse[] = [
    {
      id: 'user-1',
      email: 'dinuka.20@uom.lk',
      fullName: 'Dinuka Jayasuriya',
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: true,
      indexNumber: '200112Y',
      phoneNumber: '+94771234567',
      indexNumberVerified: false,
      badgeNumber: null,
      securityOfficeId: null,
      securityOfficeName: null,
      createdAt: '2026-11-15T10:00:00Z',
      updatedAt: '2026-11-15T10:00:00Z',
    },
    {
      id: 'user-2',
      email: 'officer.suneth@uom.lk',
      fullName: 'Suneth Perera',
      role: 'SECURITY_OFFICER',
      status: 'ACTIVE',
      emailVerified: true,
      indexNumber: null,
      phoneNumber: null,
      indexNumberVerified: false,
      badgeNumber: 'SEC-042',
      securityOfficeId: 'office-1',
      securityOfficeName: 'Central Security Office',
      createdAt: '2026-11-15T11:00:00Z',
      updatedAt: '2026-11-15T11:00:00Z',
    },
  ];

  const mockPageData: Page<AdminUserResponse> = {
    content: mockUsers,
    totalElements: 2,
    totalPages: 1,
    size: 15,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user listing with account statuses and roles', async () => {
    vi.mocked(adminService.getUsers).mockResolvedValue(mockPageData);

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User Governance')).toBeInTheDocument();
    });

    expect(screen.getByText('Dinuka Jayasuriya')).toBeInTheDocument();
    expect(screen.getByText('dinuka.20@uom.lk')).toBeInTheDocument();
    expect(screen.getAllByText('STUDENT').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Suneth Perera')).toBeInTheDocument();
    expect(screen.getByText('officer.suneth@uom.lk')).toBeInTheDocument();
    expect(screen.getAllByText('SECURITY_OFFICER').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Badge: SEC-042/i)).toBeInTheDocument();
  });

  it('triggers search query filtering when search form is submitted', async () => {
    vi.mocked(adminService.getUsers).mockResolvedValue(mockPageData);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    await user.type(searchInput, 'dinuka');
    await user.click(screen.getByRole('button', { name: /^Search$/i }));

    expect(adminService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'dinuka',
      })
    );
  });

  it('opens update status modal and submits status transition', async () => {
    vi.mocked(adminService.getUsers).mockResolvedValue(mockPageData);
    vi.mocked(adminService.updateUserStatus).mockResolvedValue({
      ...mockUsers[0],
      status: 'SUSPENDED',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dinuka Jayasuriya')).toBeInTheDocument();
    });

    const statusBtns = screen.getAllByTitle('Change Account Status');
    await user.click(statusBtns[0]);

    expect(screen.getByText('Update Account Status')).toBeInTheDocument();

    const statusSelect = screen.getByDisplayValue('ACTIVE');
    await user.selectOptions(statusSelect, 'SUSPENDED');

    await user.click(screen.getByRole('button', { name: /^Update Status$/i }));

    expect(adminService.updateUserStatus).toHaveBeenCalledWith('user-1', {
      status: 'SUSPENDED',
      reason: undefined,
    });
  });

  it('opens update role modal and submits role promotion to SECURITY_OFFICER with badge', async () => {
    vi.mocked(adminService.getUsers).mockResolvedValue(mockPageData);
    vi.mocked(adminService.updateUserRole).mockResolvedValue({
      ...mockUsers[0],
      role: 'SECURITY_OFFICER',
      badgeNumber: 'SEC-099',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dinuka Jayasuriya')).toBeInTheDocument();
    });

    const roleBtns = screen.getAllByTitle('Change Role');
    await user.click(roleBtns[0]);

    expect(screen.getByText('Change User Role')).toBeInTheDocument();

    const roleSelect = screen.getByDisplayValue('STUDENT (General User)');
    await user.selectOptions(roleSelect, 'SECURITY_OFFICER');

    const badgeInput = screen.getByPlaceholderText('e.g. SEC-042');
    await user.type(badgeInput, 'SEC-099');

    await user.click(screen.getByRole('button', { name: /^Update Role$/i }));

    expect(adminService.updateUserRole).toHaveBeenCalledWith('user-1', {
      role: 'SECURITY_OFFICER',
      badgeNumber: 'SEC-099',
      reason: undefined,
    });
  });

  it('renders detailed user administrative profile on detail page', async () => {
    vi.mocked(adminService.getUserById).mockResolvedValue(mockUsers[0]);

    render(
      <MemoryRouter initialEntries={['/admin/users/user-1']}>
        <Routes>
          <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Security & Identity')).toBeInTheDocument();
    });

    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getAllByText('dinuka.20@uom.lk').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('200112Y')).toBeInTheDocument();
    expect(screen.getByText('+94771234567')).toBeInTheDocument();
    expect(screen.getByText('Back to User Governance')).toBeInTheDocument();
  });
});
