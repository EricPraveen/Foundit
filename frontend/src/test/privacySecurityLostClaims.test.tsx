import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ROUTES } from '@/routes/paths';
import { FoundItemDetailModal } from '@/features/found-items/components/FoundItemDetailModal';
import { useFoundItemDetails } from '@/features/found-items/hooks/useFoundItemDetails';
import type { FoundItemResponse } from '@/features/found-items/types';

vi.mock('@/features/found-items/hooks/useFoundItemDetails');

describe('Privacy and Security Invariants for Lost Reports and Claims', () => {
  const mockBaseItem: FoundItemResponse = {
    id: 'item-secure-1',
    title: 'Silver ThinkPad Laptop',
    description: 'Found in library',
    categoryId: 'cat-1',
    categoryName: 'Electronics',
    locationId: 'loc-1',
    locationName: 'Central Library',
    foundAt: '2026-11-15T09:00:00Z',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    handoverStatus: 'CONFIRMED',
    availabilityStatus: 'AVAILABLE',
    images: [],
    createdAt: '2026-11-15T09:00:00Z',
    updatedAt: '2026-11-15T09:00:00Z',
  };

  it('guarantees zero public routes exist for lost reports', () => {
    // Assert ROUTES.PUBLIC contains NO lost report routes whatsoever
    const publicRoutes = Object.values(ROUTES.PUBLIC);
    const hasPublicLostReports = publicRoutes.some((route) => route.includes('lost'));
    expect(hasPublicLostReports).toBe(false);

    // Lost reports must only exist under authenticated APP routes
    expect(ROUTES.APP.LOST_REPORTS).toBe('/lost-reports');
    expect(ROUTES.APP.LOST_REPORT_DETAIL).toBe('/lost-reports/:id');
  });

  it('guarantees zero public routes exist for ownership claims', () => {
    // Assert ROUTES.PUBLIC contains NO claims routes
    const publicRoutes = Object.values(ROUTES.PUBLIC);
    const hasPublicClaims = publicRoutes.some((route) => route.includes('claim'));
    expect(hasPublicClaims).toBe(false);

    // Claims must only exist under authenticated APP routes
    expect(ROUTES.APP.CLAIMS).toBe('/claims');
    expect(ROUTES.APP.CLAIM_DETAIL).toBe('/claims/:id');
  });

  it('prohibits claiming an item when the user is the finder of that item', () => {
    vi.mocked(useFoundItemDetails).mockReturnValue({
      item: mockBaseItem,
      isLoading: false,
      error: null,
      isOwner: true, // User is the finder who reported it
      isOfficer: false,
      refetch: vi.fn(),
    });

    const onClaimMock = vi.fn();

    render(
      <FoundItemDetailModal
        itemId="item-secure-1"
        isOpen={true}
        onClose={vi.fn()}
        onClaimItem={onClaimMock}
      />
    );

    // Finder badge is shown
    expect(screen.getByText('Your Report')).toBeInTheDocument();

    // "Claim This Item" action must NOT be visible to the finder
    expect(screen.queryByRole('button', { name: /Claim This Item/i })).not.toBeInTheDocument();
  });

  it('displays "Claim This Item" only when visitor is not the finder and item is AVAILABLE', () => {
    vi.mocked(useFoundItemDetails).mockReturnValue({
      item: mockBaseItem,
      isLoading: false,
      error: null,
      isOwner: false, // Independent student visitor
      isOfficer: false,
      refetch: vi.fn(),
    });

    const onClaimMock = vi.fn();

    render(
      <FoundItemDetailModal
        itemId="item-secure-1"
        isOpen={true}
        onClose={vi.fn()}
        onClaimItem={onClaimMock}
      />
    );

    // Should display guidance and "Claim This Item" button
    expect(screen.getByText('How to Claim This Item')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claim This Item/i })).toBeInTheDocument();
  });

  it('prohibits claim action when item status is not AVAILABLE (e.g. CLAIM_PENDING)', () => {
    vi.mocked(useFoundItemDetails).mockReturnValue({
      item: {
        ...mockBaseItem,
        availabilityStatus: 'CLAIM_PENDING',
      },
      isLoading: false,
      error: null,
      isOwner: false,
      isOfficer: false,
      refetch: vi.fn(),
    });

    render(
      <FoundItemDetailModal
        itemId="item-secure-1"
        isOpen={true}
        onClose={vi.fn()}
        onClaimItem={vi.fn()}
      />
    );

    // Should display Claim Pending Review badge and NO claim button
    expect(screen.getByText('Claim Pending Review')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Claim This Item/i })).not.toBeInTheDocument();
  });
});
