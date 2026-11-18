import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminLocationsPage } from '@/pages/admin/AdminLocationsPage';
import { adminService } from '@/features/admin/services/adminService';
import type { LocationResponse } from '@/features/admin/types';

vi.mock('@/features/admin/services/adminService', () => ({
  adminService: {
    getAllLocations: vi.fn(),
    createLocation: vi.fn(),
    updateLocation: vi.fn(),
    setLocationStatus: vi.fn(),
  },
}));

describe('Admin Campus Location Management', () => {
  const mockLocations: LocationResponse[] = [
    {
      id: 'loc-1',
      name: 'Main Library 2nd Floor',
      campusZone: 'Academic Complex',
      description: 'Quiet study area and reading halls',
      active: true,
    },
    {
      id: 'loc-2',
      name: 'Gymnasium & Indoor Stadium',
      campusZone: 'Sports Complex',
      description: 'Badminton courts and fitness center',
      active: true,
    },
    {
      id: 'loc-3',
      name: 'Old Canteen Annex',
      campusZone: 'Student Center',
      description: 'Demolished cafeteria wing',
      active: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all campus locations with campus zones and active/inactive badges', async () => {
    vi.mocked(adminService.getAllLocations).mockResolvedValue(mockLocations);

    render(
      <MemoryRouter>
        <AdminLocationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Campus Location Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Main Library 2nd Floor')).toBeInTheDocument();
    expect(screen.getAllByText('Academic Complex').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Gymnasium & Indoor Stadium')).toBeInTheDocument();
    expect(screen.getAllByText('Sports Complex').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Old Canteen Annex')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('filters locations by search input and campus zone dropdown', async () => {
    vi.mocked(adminService.getAllLocations).mockResolvedValue(mockLocations);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLocationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search locations...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search locations...');
    await user.type(searchInput, 'Library');

    expect(screen.getByText('Main Library 2nd Floor')).toBeInTheDocument();
    expect(screen.queryByText('Gymnasium & Indoor Stadium')).not.toBeInTheDocument();
  });

  it('opens create location modal and submits new campus location', async () => {
    vi.mocked(adminService.getAllLocations).mockResolvedValue(mockLocations);
    vi.mocked(adminService.createLocation).mockResolvedValue({
      id: 'loc-4',
      name: 'Civil Engineering Auditorium',
      campusZone: 'Faculty of Engineering',
      description: 'Lecture Hall 1',
      active: true,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLocationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Location')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Create Location'));

    expect(screen.getByText('Create Campus Location')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e.g. Main Library/i);
    const zoneInput = screen.getByPlaceholderText(/e.g. Academic Zone/i);

    await user.type(nameInput, 'Civil Engineering Auditorium');
    await user.type(zoneInput, 'Faculty of Engineering');

    const submitBtns = screen.getAllByRole('button', { name: /^Create Location$/i });
    await user.click(submitBtns[submitBtns.length - 1]);

    expect(adminService.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Civil Engineering Auditorium',
        campusZone: 'Faculty of Engineering',
        active: true,
      })
    );
  });

  it('toggles campus location active status safely', async () => {
    vi.mocked(adminService.getAllLocations).mockResolvedValue(mockLocations);
    vi.mocked(adminService.setLocationStatus).mockResolvedValue({
      ...mockLocations[0],
      active: false,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLocationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Main Library 2nd Floor')).toBeInTheDocument();
    });

    const toggleBtns = screen.getAllByTitle('Deactivate Location');
    await user.click(toggleBtns[0]);

    expect(adminService.setLocationStatus).toHaveBeenCalledWith('loc-1', false);
  });
});
