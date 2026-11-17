import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ClaimsPage } from '@/pages/app/ClaimsPage';
import { claimService } from '@/features/claims/services/claimService';
import type { ClaimResponse, ClaimSummaryResponse } from '@/features/claims/types';
import type { Page } from '@/types/api';

vi.mock('@/features/claims/services/claimService', async () => {
  const actual = await vi.importActual<typeof import('@/features/claims/services/claimService')>(
    '@/features/claims/services/claimService'
  );
  return {
    ...actual,
    claimService: {
      ...actual.claimService,
      getMyClaims: vi.fn(),
      getClaimById: vi.fn(),
      cancelClaim: vi.fn(),
      submitClaim: vi.fn(),
    },
  };
});

describe('ClaimsPage Component', () => {
  const mockClaims: ClaimSummaryResponse[] = [
    {
      id: 'claim-1',
      foundItemId: 'item-1',
      foundItemTitle: 'Sony WH-1000XM4 Headphones',
      status: 'PENDING',
      submittedAt: '2026-11-15T09:00:00Z',
    },
    {
      id: 'claim-2',
      foundItemId: 'item-2',
      foundItemTitle: 'Leather Wallet with Cards',
      status: 'APPROVED',
      submittedAt: '2026-11-12T14:00:00Z',
      reviewedAt: '2026-11-13T10:00:00Z',
    },
    {
      id: 'claim-3',
      foundItemId: 'item-3',
      foundItemTitle: 'Dell XPS 15 Charger 130W',
      status: 'REJECTED',
      submittedAt: '2026-11-10T11:00:00Z',
      reviewedAt: '2026-11-11T15:00:00Z',
    },
  ];

  const mockPageData: Page<ClaimSummaryResponse> = {
    content: mockClaims,
    totalElements: 3,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(claimService.getMyClaims).mockResolvedValue(mockPageData);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ClaimsPage />
      </MemoryRouter>
    );
  };

  it('renders student claims with status badges and filter tab counts', async () => {
    renderComponent();

    expect(await screen.findByText('Sony WH-1000XM4 Headphones')).toBeInTheDocument();
    expect(screen.getByText('Leather Wallet with Cards')).toBeInTheDocument();
    expect(screen.getByText('Dell XPS 15 Charger 130W')).toBeInTheDocument();

    // Badges & statuses
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Approved/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rejected/i).length).toBeGreaterThan(0);
  });

  it('filters claims list when clicking status filter tabs', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByText('Sony WH-1000XM4 Headphones');

    // Click "Under Review" filter tab
    const pendingTab = screen.getByRole('button', { name: /Under Review/i });
    await user.click(pendingTab);

    expect(screen.getByText('Sony WH-1000XM4 Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Leather Wallet with Cards')).not.toBeInTheDocument();
    expect(screen.queryByText('Dell XPS 15 Charger 130W')).not.toBeInTheDocument();

    // Click "Approved" filter tab
    const approvedTab = screen.getByRole('button', { name: /^Approved/i });
    await user.click(approvedTab);

    expect(screen.queryByText('Sony WH-1000XM4 Headphones')).not.toBeInTheDocument();
    expect(screen.getByText('Leather Wallet with Cards')).toBeInTheDocument();
  });

  it('cancels a pending claim through cancel confirmation modal', async () => {
    const user = userEvent.setup();
    const updatedCancelled: ClaimResponse = {
      id: 'claim-1',
      foundItemId: 'item-1',
      foundItemTitle: 'Sony WH-1000XM4 Headphones',
      designatedSecurityOfficeId: 'off-1',
      designatedSecurityOfficeName: 'Central Security Office',
      claimant: {
        id: 'user-1',
        fullName: 'Jane Student',
        email: 'jane@uom.lk',
        indexNumber: '210002B',
      },
      ownershipDescription: 'My headphones',
      status: 'CANCELLED',
      submittedAt: '2026-11-15T09:00:00Z',
      cancelledAt: '2026-11-15T11:00:00Z',
      evidence: [],
      createdAt: '2026-11-15T09:00:00Z',
      updatedAt: '2026-11-15T11:00:00Z',
    };
    vi.mocked(claimService.cancelClaim).mockResolvedValue(updatedCancelled);

    renderComponent();

    await screen.findByText('Sony WH-1000XM4 Headphones');

    // Click "Cancel Claim" on pending card
    const cancelBtn = screen.getByRole('button', { name: /Cancel Claim/i });
    await user.click(cancelBtn);

    expect(await screen.findByText('Withdraw Claim')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm Withdrawal/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(claimService.cancelClaim).toHaveBeenCalledWith('claim-1');
    });
  });

  it('triggers resubmission modal when clicking resubmit on a rejected claim card', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByText('Dell XPS 15 Charger 130W');

    // Click "Resubmit" on the rejected card
    const resubmitBtn = screen.getByRole('button', { name: /Resubmit/i });
    await user.click(resubmitBtn);

    expect(await screen.findByText(/Claim Found Item/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dell XPS 15 Charger 130W/i).length).toBeGreaterThan(1);
  });
});
