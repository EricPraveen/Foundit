import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationsList } from '@/features/locations';
import { locationService } from '@/features/locations/services/locationService';
import { resetLocationCache } from '@/features/locations/hooks/useLocations';

vi.mock('@/features/locations/services/locationService', () => ({
  locationService: {
    getActiveLocations: vi.fn(),
  },
}));

describe('LocationsList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLocationCache();
  });

  const mockLocations = [
    {
      id: 'loc-1',
      name: 'Main Library - Ground Floor',
      campusZone: 'Academic Complex',
      description: 'Reference desk and main circulation counter',
      active: true,
    },
    {
      id: 'loc-2',
      name: 'Central Security Office',
      campusZone: 'Administration',
      description: '24/7 Custody and Handover Desk',
      active: true,
    },
    {
      id: 'loc-3',
      name: 'Gymnasium & Sports Complex',
      campusZone: 'Recreation',
      description: 'Indoor courts and equipment store',
      active: true,
    },
  ];

  it('renders active campus locations with campusZone and descriptions', async () => {
    vi.mocked(locationService.getActiveLocations).mockResolvedValueOnce(mockLocations);

    render(<LocationsList />);

    expect(screen.getByText(/Campus Locations/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Main Library - Ground Floor')).toBeInTheDocument();
      expect(screen.getByText('Central Security Office')).toBeInTheDocument();
      expect(screen.getByText('Gymnasium & Sports Complex')).toBeInTheDocument();
      expect(screen.getAllByText('Academic Complex').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Administration').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Recreation').length).toBeGreaterThan(0);
    });
  });

  it('filters locations by campus zone when zone button is clicked', async () => {
    vi.mocked(locationService.getActiveLocations).mockResolvedValueOnce(mockLocations);
    const user = userEvent.setup();

    render(<LocationsList />);

    await waitFor(() => {
      expect(screen.getByText('Main Library - Ground Floor')).toBeInTheDocument();
    });

    const adminZoneBtn = screen.getByRole('button', { name: 'Administration' });
    await user.click(adminZoneBtn);

    expect(screen.getByText('Central Security Office')).toBeInTheDocument();
    expect(screen.queryByText('Main Library - Ground Floor')).not.toBeInTheDocument();
    expect(screen.queryByText('Gymnasium & Sports Complex')).not.toBeInTheDocument();
  });

  it('filters locations by search text', async () => {
    vi.mocked(locationService.getActiveLocations).mockResolvedValueOnce(mockLocations);
    const user = userEvent.setup();

    render(<LocationsList />);

    await waitFor(() => {
      expect(screen.getByText('Main Library - Ground Floor')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search locations\.\.\./i);
    await user.type(searchInput, 'Library');

    expect(screen.getByText('Main Library - Ground Floor')).toBeInTheDocument();
    expect(screen.queryByText('Central Security Office')).not.toBeInTheDocument();
  });

  it('displays empty state when backend returns empty locations list', async () => {
    vi.mocked(locationService.getActiveLocations).mockResolvedValueOnce([]);

    render(<LocationsList />);

    await waitFor(() => {
      expect(screen.getByText(/No Campus Locations Available/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Active campus locations have not yet been provisioned by the campus administrator/i)
      ).toBeInTheDocument();
    });
  });

  it('displays error alert with retry button when API fails', async () => {
    vi.mocked(locationService.getActiveLocations).mockRejectedValueOnce(
      new Error('Network error loading locations')
    );

    render(<LocationsList />);

    await waitFor(() => {
      expect(screen.getByText(/Unable to load campus locations/i)).toBeInTheDocument();
      expect(screen.getByText('Network error loading locations')).toBeInTheDocument();
    });

    vi.mocked(locationService.getActiveLocations).mockResolvedValueOnce(mockLocations);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText('Main Library - Ground Floor')).toBeInTheDocument();
    });
  });
});
