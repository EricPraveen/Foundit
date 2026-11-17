import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OfficerFoundItemsPage } from '@/pages/officer/OfficerFoundItemsPage';
import { officerService } from '@/features/officer/services/officerService';
import type { FoundItemResponse, HandoverLogResponse, CollectionConfirmationResponse } from '@/features/officer/types';
import type { Page } from '@/types/api';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    listFoundItems: vi.fn(),
    getHandoverHistory: vi.fn(),
    getCollectionByFoundItemId: vi.fn(),
  },
}));

vi.mock('@/features/categories/services/categoryService', () => ({
  categoryService: {
    getActiveCategories: vi.fn().mockResolvedValue([
      { id: 'cat-1', name: 'Electronics', description: 'Gadgets', active: true },
    ]),
  },
}));

vi.mock('@/features/locations/services/locationService', () => ({
  locationService: {
    getActiveLocations: vi.fn().mockResolvedValue([
      { id: 'loc-1', name: 'Main Library', active: true },
    ]),
  },
}));

describe('Officer Found Items Inventory View', () => {
  const mockItems: FoundItemResponse[] = [
    {
      id: 'item-1',
      title: 'Sony WH-1000XM4 Noise Canceling Headphones',
      description: 'Found in study carrel on 2nd floor',
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      locationId: 'loc-1',
      locationName: 'Main Library',
      foundAt: '2026-11-15T10:00:00Z',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'AVAILABLE',
      finderName: 'Nadeesha Silva',
      receivingOfficerName: 'Officer Perera',
      createdAt: '2026-11-15T11:00:00Z',
      updatedAt: '2026-11-15T12:00:00Z',
      images: [],
    },
    {
      id: 'item-2',
      title: 'Dell USB-C 65W Power Adapter',
      description: 'Returned to claimant after verification',
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      locationId: 'loc-1',
      locationName: 'Main Library',
      foundAt: '2026-11-10T14:00:00Z',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'RETURNED',
      finderName: 'Kasun Bandara',
      receivingOfficerName: 'Officer Perera',
      createdAt: '2026-11-10T14:30:00Z',
      updatedAt: '2026-11-12T16:00:00Z',
      images: [],
    },
  ];

  const mockPageData: Page<FoundItemResponse> = {
    content: mockItems,
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders officer inventory with correct availability and handover badges', async () => {
    vi.mocked(officerService.listFoundItems).mockResolvedValue(mockPageData);

    render(
      <MemoryRouter>
        <OfficerFoundItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Custody Safe & Found Inventory')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Sony WH-1000XM4 Noise Canceling Headphones')
    ).toBeInTheDocument();
    expect(screen.getByText('Dell USB-C 65W Power Adapter')).toBeInTheDocument();

    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('RETURNED')).toBeInTheDocument();
    expect(screen.getAllByText('HANDED OVER')).toHaveLength(2);
  });

  it('opens handover custody audit log modal', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.listFoundItems).mockResolvedValue(mockPageData);

    const mockHistory: HandoverLogResponse[] = [
      {
        id: 'log-1',
        foundItemId: 'item-1',
        finderId: 'finder-1',
        receivingOfficerId: 'officer-1',
        securityOfficeId: 'office-1',
        handoverConfirmedAt: '2026-11-15T12:00:00Z',
        notes: 'Verified serial number ending in 4921',
        createdAt: '2026-11-15T12:00:00Z',
      },
    ];
    vi.mocked(officerService.getHandoverHistory).mockResolvedValue(mockHistory);

    render(
      <MemoryRouter>
        <OfficerFoundItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sony WH-1000XM4 Noise Canceling Headphones')).toBeInTheDocument();
    });

    const custodyButtons = screen.getAllByRole('button', { name: /Custody Log/i });
    await user.click(custodyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Handover Custody History')).toBeInTheDocument();
      expect(screen.getByText(/Verified serial number ending in 4921/i)).toBeInTheDocument();
    });
  });

  it('opens collection receipt modal for returned item', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.listFoundItems).mockResolvedValue(mockPageData);

    const mockCollection: CollectionConfirmationResponse = {
      collectionId: 'col-1',
      claimId: 'claim-1',
      foundItemId: 'item-2',
      claimantId: 'claimant-1',
      claimantName: 'Chaminda Silva',
      claimantEmail: 'chaminda@uom.lk',
      confirmingOfficerId: 'officer-1',
      confirmingOfficerName: 'Officer Perera',
      collectedAt: '2026-11-12T16:00:00Z',
      claimStatus: 'COMPLETED',
      itemAvailabilityStatus: 'RETURNED',
      linkedLostReportId: null,
      lostReportStatus: null,
      officerNotes: 'Student card verified; signed custody register',
      pointsAwarded: 50,
    };
    vi.mocked(officerService.getCollectionByFoundItemId).mockResolvedValue(mockCollection);

    render(
      <MemoryRouter>
        <OfficerFoundItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dell USB-C 65W Power Adapter')).toBeInTheDocument();
    });

    const returnReceiptButton = screen.getByRole('button', { name: /Return Receipt/i });
    await user.click(returnReceiptButton);

    await waitFor(() => {
      expect(screen.getByText('Physical Collection Confirmation Log')).toBeInTheDocument();
      expect(screen.getByText(/Chaminda Silva/i)).toBeInTheDocument();
      expect(screen.getByText(/\+50 points/i)).toBeInTheDocument();
    });
  });
});
