import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LostReportsPage } from '@/pages/app/LostReportsPage';
import { lostReportService } from '@/features/lost-reports/services/lostReportService';
import { categoryService } from '@/features/categories/services/categoryService';
import { locationService } from '@/features/locations/services/locationService';
import type { LostReportResponse } from '@/features/lost-reports/types';
import type { Page } from '@/types/api';

vi.mock('@/features/lost-reports/services/lostReportService', async () => {
  const actual = await vi.importActual<typeof import('@/features/lost-reports/services/lostReportService')>(
    '@/features/lost-reports/services/lostReportService'
  );
  return {
    ...actual,
    lostReportService: {
      ...actual.lostReportService,
      getMyLostReports: vi.fn(),
      updateLostReport: vi.fn(),
      resolveLostReport: vi.fn(),
      cancelLostReport: vi.fn(),
    },
  };
});

vi.mock('@/features/categories/services/categoryService', () => ({
  categoryService: {
    getActiveCategories: vi.fn(),
  },
}));

vi.mock('@/features/locations/services/locationService', () => ({
  locationService: {
    getActiveLocations: vi.fn(),
  },
}));

describe('My Lost Reports Management', () => {
  const mockReports: LostReportResponse[] = [
    {
      id: 'rep-1',
      title: 'Blue Hydroflask Water Bottle',
      description: 'Navy blue 32oz bottle with stickers',
      distinctiveFeatures: 'Scratch on base',
      category: { id: 'cat-1', name: 'Personal Belongings', description: 'Bottles, bags', active: true },
      location: { id: 'loc-1', name: 'Main Canteen', active: true },
      lostAt: '2026-11-14T10:00:00Z',
      designatedSecurityOffice: {
        id: 'off-1',
        name: 'Central Security Office',
        campusLocation: 'Admin 102',
        contactEmail: 'sec@uom.lk',
        contactPhone: '+94 11 2650301',
        operatingHours: '08:00 - 18:00',
        active: true,
      },
      status: 'ACTIVE',
      images: [],
      createdAt: '2026-11-14T10:15:00Z',
      updatedAt: '2026-11-14T10:15:00Z',
    },
    {
      id: 'rep-2',
      title: 'Graphing Calculator TI-84',
      description: 'Black graphing calculator',
      category: { id: 'cat-2', name: 'Electronics & Gadgets', description: 'Calculators', active: true },
      location: { id: 'loc-2', name: 'Civil Auditorium', active: true },
      lostAt: '2026-11-10T14:00:00Z',
      designatedSecurityOffice: {
        id: 'off-1',
        name: 'Central Security Office',
        campusLocation: 'Admin 102',
        contactEmail: 'sec@uom.lk',
        contactPhone: '+94 11 2650301',
        operatingHours: '08:00 - 18:00',
        active: true,
      },
      status: 'RESOLVED',
      resolutionNotes: 'Found in my dorm room',
      resolvedAt: '2026-11-12T16:00:00Z',
      images: [],
      createdAt: '2026-11-10T14:30:00Z',
      updatedAt: '2026-11-12T16:00:00Z',
    },
    {
      id: 'rep-3',
      title: 'Navy Umbrella with Wooden Handle',
      description: 'Lost on rainy Tuesday',
      category: { id: 'cat-1', name: 'Personal Belongings', description: 'Bottles, bags', active: true },
      location: { id: 'loc-1', name: 'Main Canteen', active: true },
      lostAt: '2026-11-05T12:00:00Z',
      designatedSecurityOffice: {
        id: 'off-1',
        name: 'Central Security Office',
        campusLocation: 'Admin 102',
        contactEmail: 'sec@uom.lk',
        contactPhone: '+94 11 2650301',
        operatingHours: '08:00 - 18:00',
        active: true,
      },
      status: 'CANCELLED',
      cancellationReason: 'No longer needed',
      cancelledAt: '2026-11-06T09:00:00Z',
      images: [],
      createdAt: '2026-11-05T12:30:00Z',
      updatedAt: '2026-11-06T09:00:00Z',
    },
  ];

  const mockPageData: Page<LostReportResponse> = {
    content: mockReports,
    totalElements: 3,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(lostReportService.getMyLostReports).mockResolvedValue(mockPageData);
    vi.mocked(categoryService.getActiveCategories).mockResolvedValue([
      { id: 'cat-1', name: 'Personal Belongings', description: 'Personal', active: true },
      { id: 'cat-2', name: 'Electronics & Gadgets', description: 'Electronics', active: true },
    ]);
    vi.mocked(locationService.getActiveLocations).mockResolvedValue([
      { id: 'loc-1', name: 'Main Canteen', active: true },
      { id: 'loc-2', name: 'Civil Auditorium', active: true },
    ]);
  });

  it('renders student lost reports with status badges and filter tab counts', async () => {
    render(<LostReportsPage />);

    expect(await screen.findByText('Blue Hydroflask Water Bottle')).toBeInTheDocument();
    expect(screen.getByText('Graphing Calculator TI-84')).toBeInTheDocument();
    expect(screen.getByText('Navy Umbrella with Wooden Handle')).toBeInTheDocument();

    // Badges and Tab labels
    expect(screen.getAllByText('Active Search').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThan(0);
  });

  it('filters reports when selecting status tabs', async () => {
    const user = userEvent.setup();
    render(<LostReportsPage />);

    await screen.findByText('Blue Hydroflask Water Bottle');

    // Click "Active Search" tab
    const activeTab = screen.getByRole('button', { name: /Active Search/i });
    await user.click(activeTab);

    expect(screen.getByText('Blue Hydroflask Water Bottle')).toBeInTheDocument();
    expect(screen.queryByText('Graphing Calculator TI-84')).not.toBeInTheDocument();
    expect(screen.queryByText('Navy Umbrella with Wooden Handle')).not.toBeInTheDocument();

    // Click "Resolved" tab
    const resolvedTab = screen.getByRole('button', { name: /^Resolved/i });
    await user.click(resolvedTab);

    expect(screen.queryByText('Blue Hydroflask Water Bottle')).not.toBeInTheDocument();
    expect(screen.getByText('Graphing Calculator TI-84')).toBeInTheDocument();
  });

  it('resolves an active report with resolution notes', async () => {
    const user = userEvent.setup();
    const updatedResolved: LostReportResponse = {
      ...mockReports[0],
      status: 'RESOLVED',
      resolutionNotes: 'Found in the canteen bag rack',
      resolvedAt: '2026-11-15T12:00:00Z',
    };
    vi.mocked(lostReportService.resolveLostReport).mockResolvedValue(updatedResolved);

    render(<LostReportsPage />);

    await screen.findByText('Blue Hydroflask Water Bottle');

    // Click "Resolve" on the active card using title
    const resolveBtn = screen.getByTitle('Mark as Resolved');
    await user.click(resolveBtn);

    expect(await screen.findByText(/Mark Item as Found \/ Recovered/i)).toBeInTheDocument();

    const notesInput = screen.getByPlaceholderText(/Recovered from the library help desk/i);
    await user.type(notesInput, 'Found in the canteen bag rack');

    const confirmBtn = screen.getByRole('button', { name: /Confirm Resolution/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(lostReportService.resolveLostReport).toHaveBeenCalledWith(
        'rep-1',
        { resolutionNotes: 'Found in the canteen bag rack' }
      );
    });
  });

  it('cancels an active report with cancellation reason', async () => {
    const user = userEvent.setup();
    const updatedCancelled: LostReportResponse = {
      ...mockReports[0],
      status: 'CANCELLED',
      cancellationReason: 'Found an old spare bottle',
      cancelledAt: '2026-11-15T12:00:00Z',
    };
    vi.mocked(lostReportService.cancelLostReport).mockResolvedValue(updatedCancelled);

    render(<LostReportsPage />);

    await screen.findByText('Blue Hydroflask Water Bottle');

    // Click "Cancel" on the active card using title
    const cancelBtn = screen.getByTitle('Cancel Report');
    await user.click(cancelBtn);

    expect(await screen.findByText(/Withdraw Lost Report/i)).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Reported by mistake/i);
    await user.type(reasonInput, 'Found an old spare bottle');

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(lostReportService.cancelLostReport).toHaveBeenCalledWith(
        'rep-1',
        { cancellationReason: 'Found an old spare bottle' }
      );
    });
  });
});
