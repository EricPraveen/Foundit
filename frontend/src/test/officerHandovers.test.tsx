import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OfficerHandoversPage } from '@/pages/officer/OfficerHandoversPage';
import { OfficerHandoverDetailPage } from '@/pages/officer/OfficerHandoverDetailPage';
import { officerService } from '@/features/officer/services/officerService';
import type { FoundItemResponse } from '@/features/officer/types';
import type { Page } from '@/types/api';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    getPendingHandovers: vi.fn(),
    getOverdueHandovers: vi.fn(),
    confirmHandover: vi.fn(),
    getHandoverHistory: vi.fn(),
    getFoundItemById: vi.fn(),
  },
}));

describe('Officer Handover Management & Verification', () => {
  const mockPendingItems: FoundItemResponse[] = [
    {
      id: 'item-101',
      title: 'Scientific Calculator Casio fx-991ES',
      description: 'Found on desk in Civil Engineering seminar room',
      categoryId: 'cat-1',
      categoryName: 'Calculators & Electronics',
      locationId: 'loc-1',
      locationName: 'Civil Engineering Building',
      specificLocation: 'Seminar Room 2',
      foundAt: '2026-11-17T10:00:00Z',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'PENDING',
      availabilityStatus: 'UNAVAILABLE',
      finderName: 'Sunil Weerasinghe',
      createdAt: '2026-11-17T11:00:00Z',
      updatedAt: '2026-11-17T11:00:00Z',
      images: [],
    },
    {
      id: 'item-102',
      title: 'Leather Wallet with Identity Card',
      description: 'Black bi-fold wallet left on cafeteria counter',
      categoryId: 'cat-2',
      categoryName: 'Wallets & Bags',
      locationId: 'loc-2',
      locationName: 'Main Cafeteria',
      foundAt: '2026-11-15T09:00:00Z',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'PENDING',
      availabilityStatus: 'UNAVAILABLE',
      finderName: 'Anura Bandara',
      // Created > 24 hours ago
      createdAt: '2026-11-15T09:30:00Z',
      updatedAt: '2026-11-15T09:30:00Z',
      images: [],
    },
  ];

  const mockPageData: Page<FoundItemResponse> = {
    content: mockPendingItems,
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

  it('renders pending handovers list with finder details and overdue badge', async () => {
    vi.mocked(officerService.getPendingHandovers).mockResolvedValue(mockPageData);
    vi.mocked(officerService.getOverdueHandovers).mockResolvedValue([mockPendingItems[1]]);

    render(
      <MemoryRouter>
        <OfficerHandoversPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Handover Verification')).toBeInTheDocument();
    });

    expect(screen.getByText('Scientific Calculator Casio fx-991ES')).toBeInTheDocument();
    expect(screen.getByText('Leather Wallet with Identity Card')).toBeInTheDocument();
    expect(screen.getByText('Sunil Weerasinghe')).toBeInTheDocument();
    expect(screen.getByText('Anura Bandara')).toBeInTheDocument();

    // Overdue alert banner and badge for item-102 (>24h)
    expect(screen.getByText(/Pending Handovers Overdue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Overdue >24h/i).length).toBeGreaterThan(0);
  });

  it('officer confirms physical receipt and transitions item to AVAILABLE', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.getPendingHandovers).mockResolvedValue(mockPageData);
    vi.mocked(officerService.getOverdueHandovers).mockResolvedValue([]);

    const updatedItem: FoundItemResponse = {
      ...mockPendingItems[0],
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'AVAILABLE',
      receivingOfficerName: 'Officer Silva',
      handoverConfirmedAt: '2026-11-17T14:30:00Z',
    };
    vi.mocked(officerService.confirmHandover).mockResolvedValue(updatedItem);

    render(
      <MemoryRouter>
        <OfficerHandoversPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Scientific Calculator Casio fx-991ES')).toBeInTheDocument();
    });

    // Click confirm button on first item
    const confirmButtons = screen.getAllByRole('button', { name: /Confirm Physical Receipt/i });
    await user.click(confirmButtons[0]);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Confirm Physical Handover')).toBeInTheDocument();
      expect(screen.getByText(/Confirming receipt will transition this item from/i)).toBeInTheDocument();
    });

    // Enter notes
    const notesInput = screen.getByLabelText(/Officer Custody Notes/i);
    await user.type(notesInput, 'Received in safe bin A-12, good condition.');

    // Submit confirmation
    const submitBtn = screen.getByRole('button', { name: /Confirm Receipt & Make Available/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(officerService.confirmHandover).toHaveBeenCalledWith('item-101', {
        officerNotes: 'Received in safe bin A-12, good condition.',
      });
    });

    // Success notice displayed
    await waitFor(() => {
      expect(screen.getByText(/Handover Confirmed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Physical receipt confirmed for "Scientific Calculator Casio fx-991ES"/i)
      ).toBeInTheDocument();
    });
  });

  it('inspects item detail page and confirms receipt from detail view', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.getFoundItemById).mockResolvedValue(mockPendingItems[0]);

    const confirmedItem: FoundItemResponse = {
      ...mockPendingItems[0],
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'AVAILABLE',
    };
    vi.mocked(officerService.confirmHandover).mockResolvedValue(confirmedItem);

    render(
      <MemoryRouter initialEntries={['/officer/handovers/item-101']}>
        <Routes>
          <Route path="/officer/handovers/:itemId" element={<OfficerHandoverDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Scientific Calculator Casio fx-991ES')).toBeInTheDocument();
      expect(screen.getByText('Civil Engineering Building')).toBeInTheDocument();
      expect(screen.getByText('Sunil Weerasinghe')).toBeInTheDocument();
    });

    // Click confirm
    const confirmBtn = screen.getByRole('button', { name: /Confirm Physical Handover/i });
    await user.click(confirmBtn);

    const submitModalBtn = screen.getByRole('button', { name: /Confirm Receipt & Make Available/i });
    await user.click(submitModalBtn);

    await waitFor(() => {
      expect(officerService.confirmHandover).toHaveBeenCalledWith('item-101', {
        officerNotes: undefined,
      });
      expect(screen.getByText(/Physical receipt confirmed/i)).toBeInTheDocument();
    });
  });
});
