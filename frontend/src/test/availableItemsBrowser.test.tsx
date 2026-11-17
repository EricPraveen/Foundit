import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FoundItemsPage } from '@/pages/app/FoundItemsPage';
import { foundItemService } from '@/features/found-items/services/foundItemService';
import { categoryService } from '@/features/categories/services/categoryService';
import { locationService } from '@/features/locations/services/locationService';
import { resetCategoryCache } from '@/features/categories/hooks/useCategories';
import { resetLocationCache } from '@/features/locations/hooks/useLocations';
import { resetSecurityOfficeCache } from '@/features/found-items/hooks/useSecurityOffice';
import type { FoundItemSummaryResponse } from '@/features/found-items/types';
import type { Page } from '@/types/api';

vi.mock('@/features/found-items/services/foundItemService', async () => {
  const actual = await vi.importActual<typeof import('@/features/found-items/services/foundItemService')>(
    '@/features/found-items/services/foundItemService'
  );
  return {
    ...actual,
    foundItemService: {
      ...actual.foundItemService,
      getAvailableFoundItems: vi.fn(),
      getMyFoundReports: vi.fn(),
      getFoundItemById: vi.fn(),
      getCentralSecurityOffice: vi.fn(),
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

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'student-1',
      email: 'student@uom.lk',
      fullName: 'Student Finder',
      role: 'STUDENT',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('Available Items Browser (FoundItemsPage)', () => {
  const mockAvailableItems: FoundItemSummaryResponse[] = [
    {
      id: 'found-summary-1',
      title: 'Hydro Flask Water Bottle',
      description: 'Blue 32oz bottle with stickers found near canteen',
      categoryId: 'cat-1',
      categoryName: 'Personal Items',
      locationId: 'loc-1',
      locationName: 'Student Canteen',
      specificLocation: 'Table 12',
      foundAt: '2026-11-15T12:00:00Z',
      availabilityStatus: 'AVAILABLE',
      imageUrls: ['/api/v1/storage/found-items/flask.jpg'],
      createdAt: '2026-11-15T12:30:00Z',
    },
    {
      id: 'found-summary-2',
      title: 'Graphing Notebook',
      description: 'Hardcover mathematics notes found in seminar hall',
      categoryId: 'cat-2',
      categoryName: 'Books & Stationery',
      locationId: 'loc-2',
      locationName: 'Civil Complex',
      specificLocation: 'Seminar Room 3',
      foundAt: '2026-11-14T09:00:00Z',
      availabilityStatus: 'AVAILABLE',
      imageUrls: [],
      createdAt: '2026-11-14T10:00:00Z',
    },
  ];

  const mockAvailablePage: Page<FoundItemSummaryResponse> = {
    content: mockAvailableItems,
    totalElements: 2,
    totalPages: 1,
    size: 12,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockOffice = {
    id: 'office-1',
    name: 'Central Security Office',
    campusLocation: 'Admin Building Ground Floor, Room 102',
    contactEmail: 'security@uom.lk',
    contactPhone: '+94 11 2650301',
    operatingHours: 'Mon - Fri 08:00 - 18:00',
    active: true,
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Personal Items', description: 'Bottles, bags', active: true },
    { id: 'cat-2', name: 'Books & Stationery', description: 'Notes, books', active: true },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Student Canteen', campusZone: 'Central', active: true },
    { id: 'loc-2', name: 'Civil Complex', campusZone: 'East', active: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    resetSecurityOfficeCache();
    resetCategoryCache();
    resetLocationCache();

    vi.mocked(foundItemService.getCentralSecurityOffice).mockResolvedValue(mockOffice);
    vi.mocked(categoryService.getActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(locationService.getActiveLocations).mockResolvedValue(mockLocations);
    vi.mocked(foundItemService.getAvailableFoundItems).mockResolvedValue(mockAvailablePage);
    vi.mocked(foundItemService.getMyFoundReports).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 50,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });
  });

  it('loads and renders available items from backend with public-safe attributes', async () => {
    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Found Items & Custody/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hydro Flask Water Bottle')).toBeInTheDocument();
      expect(screen.getByText('Graphing Notebook')).toBeInTheDocument();
      expect(screen.getByText('Student Canteen • Table 12')).toBeInTheDocument();
      expect(screen.getByText('Civil Complex • Seminar Room 3')).toBeInTheDocument();
    });

    // Verify finder identity is not exposed in public cards
    expect(screen.queryByText(/Discovered by/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Alice Perera/i)).not.toBeInTheDocument();

    expect(foundItemService.getAvailableFoundItems).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 12, sort: 'foundAt,desc' })
    );
  });

  it('filters catalog when typing in search input', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hydro Flask Water Bottle')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by item title or description/i);
    await user.type(searchInput, 'calculator');

    await waitFor(() => {
      expect(foundItemService.getAvailableFoundItems).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'calculator' })
      );
    });
  });

  it('filters catalog by category and location dropdown selections', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Personal Items')[0]).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/Category/i);
    await user.selectOptions(categorySelect, 'cat-1');

    await waitFor(() => {
      expect(foundItemService.getAvailableFoundItems).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' })
      );
    });

    const locationSelect = screen.getByLabelText(/Campus Location/i);
    await user.selectOptions(locationSelect, 'loc-2');

    await waitFor(() => {
      expect(foundItemService.getAvailableFoundItems).toHaveBeenCalledWith(
        expect.objectContaining({ locationId: 'loc-2' })
      );
    });
  });

  it('renders empty state when no items match filters and provides a reset button', async () => {
    const user = userEvent.setup();
    vi.mocked(foundItemService.getAvailableFoundItems).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 12,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });

    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('No Available Items Found')).toBeInTheDocument();
    const clearBtn = screen.getByRole('button', { name: /Clear Search Filters/i });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);
    await waitFor(() => {
      expect(foundItemService.getAvailableFoundItems).toHaveBeenCalledWith(
        expect.objectContaining({ query: '' })
      );
    });
  });

  it('opens item details modal when clicking "View Details"', async () => {
    const user = userEvent.setup();
    vi.mocked(foundItemService.getFoundItemById).mockResolvedValue({
      id: 'found-summary-1',
      title: 'Hydro Flask Water Bottle',
      description: 'Blue 32oz bottle with stickers found near canteen',
      categoryId: 'cat-1',
      categoryName: 'Personal Items',
      locationId: 'loc-1',
      locationName: 'Student Canteen',
      specificLocation: 'Table 12',
      foundAt: '2026-11-15T12:00:00Z',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'AVAILABLE',
      finderName: null, // Masked for non-owner public
      discoveredByUserId: null,
      images: [],
      createdAt: '2026-11-15T12:30:00Z',
      updatedAt: '2026-11-15T13:00:00Z',
    });

    render(
      <MemoryRouter>
        <FoundItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hydro Flask Water Bottle')).toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    await user.click(viewDetailsButtons[0]);

    await waitFor(() => {
      expect(foundItemService.getFoundItemById).toHaveBeenCalledWith('found-summary-1');
    });

    expect(await screen.findByText('How to Claim This Item')).toBeInTheDocument();
    expect(screen.getAllByText(/Central Security Office/i).length).toBeGreaterThan(0);
  });
});
