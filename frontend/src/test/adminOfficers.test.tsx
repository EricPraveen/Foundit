import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminOfficersPage } from '@/pages/admin/AdminOfficersPage';
import { adminService } from '@/features/admin/services/adminService';
import type { OfficerProfileResponse, SecurityOfficeResponse } from '@/features/admin/types';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    listOfficers: vi.fn(),
    getCentralOffice: vi.fn(),
    provisionOfficer: vi.fn(),
    updateCentralOffice: vi.fn(),
  },
}));

describe('Admin Security Officer Management', () => {
  const mockOffice: SecurityOfficeResponse = {
    id: 'office-1',
    name: 'Central Security Office',
    campusLocation: 'Administration Building Ground Floor',
    contactEmail: 'security@uom.lk',
    contactPhone: '+94112650301',
    operatingHours: '24/7 Desk',
    active: true,
  };

  const mockOfficers: OfficerProfileResponse[] = [
    {
      userId: 'officer-1',
      email: 'officer.kamal@uom.lk',
      fullName: 'Kamal Gunaratne',
      role: 'SECURITY_OFFICER',
      status: 'ACTIVE',
      badgeNumber: 'SEC-001',
      officeName: 'Central Security Office',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Central Security Office parameters and provisioned officers', async () => {
    vi.mocked(adminService.getCentralOffice).mockResolvedValue(mockOffice);
    vi.mocked(adminService.listOfficers).mockResolvedValue(mockOfficers);

    render(
      <MemoryRouter>
        <AdminOfficersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    });

    expect(screen.getByText('Administration Building Ground Floor')).toBeInTheDocument();
    expect(screen.getByText('security@uom.lk')).toBeInTheDocument();
    expect(screen.getByText('+94112650301')).toBeInTheDocument();

    expect(screen.getByText('Kamal Gunaratne')).toBeInTheDocument();
    expect(screen.getByText('officer.kamal@uom.lk')).toBeInTheDocument();
    expect(screen.getByText('SEC-001')).toBeInTheDocument();
  });

  it('provisions new security officer account with validation', async () => {
    vi.mocked(adminService.getCentralOffice).mockResolvedValue(mockOffice);
    vi.mocked(adminService.listOfficers).mockResolvedValue(mockOfficers);
    vi.mocked(adminService.provisionOfficer).mockResolvedValue({
      userId: 'officer-2',
      email: 'officer.nimal@uom.lk',
      fullName: 'Nimal Silva',
      role: 'SECURITY_OFFICER',
      status: 'ACTIVE',
      badgeNumber: 'SEC-002',
      officeName: 'Central Security Office',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminOfficersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Provision New Officer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Provision New Officer'));

    expect(screen.getByText('Provision Security Officer Account')).toBeInTheDocument();

    // Fill form
    const emailInput = screen.getByPlaceholderText('officer.name@uom.lk');
    const nameInput = screen.getByPlaceholderText('e.g. Officer Suneth Perera');
    const pwdInput = screen.getByPlaceholderText('Minimum 8 characters');
    const badgeInput = screen.getByPlaceholderText('e.g. SEC-019');

    await user.type(emailInput, 'officer.nimal@uom.lk');
    await user.type(nameInput, 'Nimal Silva');
    await user.type(pwdInput, 'securePass123!');
    await user.type(badgeInput, 'SEC-002');

    await user.click(screen.getByRole('button', { name: /^Provision Officer$/i }));

    expect(adminService.provisionOfficer).toHaveBeenCalledWith({
      email: 'officer.nimal@uom.lk',
      fullName: 'Nimal Silva',
      password: 'securePass123!',
      badgeNumber: 'SEC-002',
    });
  });

  it('updates Central Security Office public contacts and operating hours', async () => {
    vi.mocked(adminService.getCentralOffice).mockResolvedValue(mockOffice);
    vi.mocked(adminService.listOfficers).mockResolvedValue(mockOfficers);
    vi.mocked(adminService.updateCentralOffice).mockResolvedValue({
      ...mockOffice,
      contactPhone: '+94112650999',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminOfficersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Configure Office')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Configure Office'));

    expect(screen.getByText('Configure Central Security Office')).toBeInTheDocument();

    const phoneInput = screen.getByDisplayValue('+94112650301');
    await user.clear(phoneInput);
    await user.type(phoneInput, '+94112650999');

    await user.click(screen.getByRole('button', { name: /^Save Changes$/i }));

    expect(adminService.updateCentralOffice).toHaveBeenCalledWith(
      expect.objectContaining({
        contactPhone: '+94112650999',
      })
    );
  });
});
