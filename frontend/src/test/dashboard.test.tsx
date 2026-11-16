import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { AuthProvider } from '@/features/auth';
import { dashboardService } from '@/features/dashboard/services/dashboardService';
import { categoryService } from '@/features/categories/services/categoryService';
import { locationService } from '@/features/locations/services/locationService';
import { resetCategoryCache } from '@/features/categories/hooks/useCategories';
import { resetLocationCache } from '@/features/locations/hooks/useLocations';
import { User } from '@/types/auth';

vi.mock('@/features/dashboard/services/dashboardService', () => ({
  dashboardService: {
    getMyFoundReports: vi.fn(),
    getMyLostReports: vi.fn(),
    getMyClaims: vi.fn(),
    getReputationBalance: vi.fn(),
    getRecentReputationTransactions: vi.fn(),
  },
}));

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

describe('DashboardPage Component', () => {
  const mockUser: User = {
    id: 'student-1',
    email: 'nimal@uom.lk',
    fullName: 'Nimal Silva',
    role: 'STUDENT',
  };

  const mockFoundReports = {
    content: [
      {
        id: 'found-1',
        title: 'Sony Wireless Headphones',
        description: 'Black WH-1000XM4 found near library',
        category: { id: 'c1', name: 'Electronics', description: 'Tech items', active: true },
        location: { id: 'l1', name: 'Main Library', active: true },
        foundAt: '2026-11-15T10:00:00Z',
        status: 'AVAILABLE' as const,
        createdAt: '2026-11-15T11:00:00Z',
      },
    ],
    totalElements: 4,
    totalPages: 1,
    size: 5,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockLostReports = {
    content: [
      {
        id: 'lost-1',
        title: 'Dell XPS 15 Laptop Charger',
        description: 'Black 130W USB-C charger',
        category: { id: 'c1', name: 'Electronics', description: 'Tech items', active: true },
        location: { id: 'l2', name: 'Computer Lab 3', active: true },
        lostAt: '2026-11-14T14:00:00Z',
        status: 'ACTIVE' as const,
        createdAt: '2026-11-14T15:00:00Z',
      },
    ],
    totalElements: 2,
    totalPages: 1,
    size: 5,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockClaims = {
    content: [
      {
        id: 'claim-1',
        foundItemId: 'found-10',
        foundItemTitle: 'Scientific Calculator fx-991ES',
        status: 'APPROVED' as const,
        submittedAt: '2026-11-15T16:00:00Z',
        reviewedAt: '2026-11-16T08:00:00Z',
      },
    ],
    totalElements: 3,
    totalPages: 1,
    size: 5,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockReputationBalance = {
    userId: 'student-1',
    currentBalance: 45,
    totalEarned: 45,
    totalTransactions: 3,
  };

  const mockReputationTransactions = {
    content: [
      {
        id: 'tx-10',
        transactionType: 'FOUND_ITEM_HANDOVER' as const,
        points: 20,
        description: 'Points awarded for handover of Sony Headphones',
        createdAt: '2026-11-15T12:00:00Z',
      },
    ],
    totalElements: 1,
    totalPages: 1,
    size: 5,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetCategoryCache();
    resetLocationCache();

    vi.mocked(dashboardService.getMyFoundReports).mockResolvedValue(mockFoundReports);
    vi.mocked(dashboardService.getMyLostReports).mockResolvedValue(mockLostReports);
    vi.mocked(dashboardService.getMyClaims).mockResolvedValue(mockClaims);
    vi.mocked(dashboardService.getReputationBalance).mockResolvedValue(mockReputationBalance);
    vi.mocked(dashboardService.getRecentReputationTransactions).mockResolvedValue(mockReputationTransactions);
    vi.mocked(categoryService.getActiveCategories).mockResolvedValue([]);
    vi.mocked(locationService.getActiveLocations).mockResolvedValue([]);
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <AuthProvider initialUser={mockUser} initialToken="mock-token">
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders student welcome greeting and role badge', async () => {
    renderDashboard();

    expect(screen.getByText(/Welcome back, Nimal Silva/i)).toBeInTheDocument();
    expect(screen.getAllByText('Student').length).toBeGreaterThan(0);
  });

  it('renders authentic summary statistics sourced directly from backend totalElements', async () => {
    renderDashboard();

    await waitFor(() => {
      // Reputation points balance: 45
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('(45 earned)')).toBeInTheDocument();

      // Found reports count: 4
      expect(screen.getByText('4')).toBeInTheDocument();

      // Lost reports count: 2
      expect(screen.getByText('2')).toBeInTheDocument();

      // Claims count: 3
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('renders recent student activity items with authentic status badges', async () => {
    renderDashboard();

    await waitFor(() => {
      // Lost report item
      expect(screen.getByText('Dell XPS 15 Laptop Charger')).toBeInTheDocument();
      expect(screen.getByText('Searching (Active)')).toBeInTheDocument();

      // Found item report
      expect(screen.getByText('Sony Wireless Headphones')).toBeInTheDocument();
      expect(screen.getByText('Available at Counter')).toBeInTheDocument();

      // Claim item
      expect(screen.getByText('Claim for: Scientific Calculator fx-991ES')).toBeInTheDocument();
      expect(screen.getByText('Approved for Pickup')).toBeInTheDocument();

      // Reputation transaction
      expect(screen.getByText('Points awarded for handover of Sony Headphones')).toBeInTheDocument();
      expect(screen.getByText('+20 pts')).toBeInTheDocument();
    });
  });

  it('filters recent activity by tabs', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dell XPS 15 Laptop Charger')).toBeInTheDocument();
    });

    // Click "Lost" tab
    await user.click(screen.getByRole('button', { name: 'Lost' }));
    expect(screen.getByText('Dell XPS 15 Laptop Charger')).toBeInTheDocument();
    expect(screen.queryByText('Sony Wireless Headphones')).not.toBeInTheDocument();
    expect(screen.queryByText('Claim for: Scientific Calculator fx-991ES')).not.toBeInTheDocument();

    // Click "Found" tab
    await user.click(screen.getByRole('button', { name: 'Found' }));
    expect(screen.getByText('Sony Wireless Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Dell XPS 15 Laptop Charger')).not.toBeInTheDocument();

    // Click "Claims" tab
    await user.click(screen.getByRole('button', { name: 'Claims' }));
    expect(screen.getByText('Claim for: Scientific Calculator fx-991ES')).toBeInTheDocument();
    expect(screen.queryByText('Sony Wireless Headphones')).not.toBeInTheDocument();
  });

  it('handles partial dashboard section failures gracefully without breaking the entire screen', async () => {
    // Claims fails with an error, but found reports, lost reports, and reputation succeed
    vi.mocked(dashboardService.getMyClaims).mockRejectedValueOnce(
      new Error('Claims service temporarily unavailable')
    );

    renderDashboard();

    await waitFor(() => {
      // Reputation, Found, and Lost stats still render successfully
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Claims stat card displays unavailable and error
      expect(screen.getByText(/Some dashboard data could not be refreshed/i)).toBeInTheDocument();
      expect(screen.getByText(/Claims: Claims service temporarily unavailable/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when user has zero reports and claims', async () => {
    vi.mocked(dashboardService.getMyFoundReports).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });
    vi.mocked(dashboardService.getMyLostReports).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });
    vi.mocked(dashboardService.getMyClaims).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });
    vi.mocked(dashboardService.getRecentReputationTransactions).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });

    renderDashboard();

    await waitFor(() => {
      // Genuine 0 stats
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getByText('No Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('You have no recent lost reports, found items, or claims on CampusFind.')).toBeInTheDocument();
    });
  });

  it('toggles campus reference directory views for categories and locations', async () => {
    vi.mocked(categoryService.getActiveCategories).mockResolvedValueOnce([
      { id: 'cat-unique-1', name: 'Musical Instruments', description: 'Guitars, violins, keyboards', active: true },
    ]);
    vi.mocked(locationService.getActiveLocations).mockResolvedValueOnce([
      { id: 'loc-unique-1', name: 'Civil Engineering Auditorium', active: true },
    ]);

    const user = userEvent.setup();
    renderDashboard();

    const browseCategoriesBtn = screen.getByRole('button', { name: /Browse Categories/i });
    await user.click(browseCategoriesBtn);

    await waitFor(() => {
      expect(screen.getByText('Musical Instruments')).toBeInTheDocument();
      expect(screen.getByText('Guitars, violins, keyboards')).toBeInTheDocument();
    });

    const browseLocationsBtn = screen.getByRole('button', { name: /Browse Locations/i });
    await user.click(browseLocationsBtn);

    await waitFor(() => {
      expect(screen.getByText('Civil Engineering Auditorium')).toBeInTheDocument();
    });
  });
});
