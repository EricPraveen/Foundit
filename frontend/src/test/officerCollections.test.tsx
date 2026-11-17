import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OfficerCollectionsPage } from '@/pages/officer/OfficerCollectionsPage';
import { OfficerCollectionDetailPage } from '@/pages/officer/OfficerCollectionDetailPage';
import { OfficerReturnedItemsPage } from '@/pages/officer/OfficerReturnedItemsPage';
import { officerService } from '@/features/officer/services/officerService';
import type {
  ClaimResponse,
  CollectionConfirmationResponse,
  FoundItemResponse,
} from '@/features/officer/types';
import type { Page } from '@/types/api';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    listClaims: vi.fn(),
    getClaimById: vi.fn(),
    confirmCollection: vi.fn(),
    getCollectionByClaimId: vi.fn(),
    getCollectionByFoundItemId: vi.fn(),
    listFoundItems: vi.fn(),
    getHandoverHistory: vi.fn(),
  },
}));

describe('Officer Collections Queue & Physical Handover Confirmation', () => {
  const mockApprovedClaim: ClaimResponse = {
    id: 'claim-301',
    foundItemId: 'item-801',
    foundItemTitle: 'Casio G-Shock Watch Black',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    claimant: {
      id: 'student-401',
      fullName: 'Tharindu Gunasekara',
      email: 'tharindu.g@uom.lk',
      phoneNumber: '+94778899001',
      indexNumber: '200112Y',
    },
    ownershipDescription: 'Matte black G-Shock GA-2100 with scratch on buckle',
    status: 'APPROVED',
    reviewingOfficerId: 'officer-1',
    reviewingOfficerName: 'Officer Jayawardena',
    reviewNotes: 'Verified warranty card serial number',
    rejectionReason: null,
    submittedAt: '2026-11-16T10:00:00Z',
    reviewedAt: '2026-11-16T14:00:00Z',
    cancelledAt: null,
    evidence: [],
    createdAt: '2026-11-16T10:00:00Z',
    updatedAt: '2026-11-16T14:00:00Z',
  };

  const mockClaimsPage: Page<ClaimResponse> = {
    content: [mockApprovedClaim],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockCollectionResponse: CollectionConfirmationResponse = {
    collectionId: 'col-901',
    claimId: 'claim-301',
    foundItemId: 'item-801',
    claimantId: 'student-401',
    claimantName: 'Tharindu Gunasekara',
    claimantEmail: 'tharindu.g@uom.lk',
    confirmingOfficerId: 'officer-1',
    confirmingOfficerName: 'Officer Jayawardena',
    collectedAt: '2026-11-17T15:00:00Z',
    claimStatus: 'COMPLETED',
    itemAvailabilityStatus: 'RETURNED',
    linkedLostReportId: 'lost-report-99',
    lostReportStatus: 'RECOVERED',
    officerNotes: 'Student verified physical ID card and signed custody register',
    pointsAwarded: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending collections queue with claimant details and approval status', async () => {
    vi.mocked(officerService.listClaims).mockResolvedValue(mockClaimsPage);

    render(
      <MemoryRouter>
        <OfficerCollectionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Physical Collections')).toBeInTheDocument();
    });

    expect(screen.getByText('Casio G-Shock Watch Black')).toBeInTheDocument();
    expect(screen.getByText('Tharindu Gunasekara')).toBeInTheDocument();
    expect(screen.getByText('200112Y')).toBeInTheDocument();
    expect(screen.getByText(/APPROVED \(Awaiting Pickup\)/i)).toBeInTheDocument();
  });

  it('confirms physical collection with checklist verification and records return', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.getClaimById).mockResolvedValue(mockApprovedClaim);
    vi.mocked(officerService.confirmCollection).mockResolvedValue(mockCollectionResponse);

    render(
      <MemoryRouter initialEntries={['/officer/collections/claim-301']}>
        <Routes>
          <Route path="/officer/collections/:claimId" element={<OfficerCollectionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Physical Item Handover & Collection/i })).toBeInTheDocument();
      expect(screen.getAllByText('Casio G-Shock Watch Black').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('200112Y').length).toBeGreaterThanOrEqual(1);
    });

    // Check verification boxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.change(checkboxes[0], { target: { checked: true } });
    fireEvent.click(checkboxes[1]);
    fireEvent.change(checkboxes[1], { target: { checked: true } });

    // Enter notes and optional lost report id
    const notesInput = screen.getByLabelText(/Officer Custody Notes/i);
    await user.type(notesInput, 'Student verified physical ID card and signed custody register');

    const lostReportInput = screen.getByLabelText(/Claimant's Lost Report ID/i);
    await user.type(lostReportInput, 'lost-report-99');

    // Submit
    const submitBtn = screen.getByRole('button', {
      name: /Confirm Physical Handover & Mark RETURNED/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(officerService.confirmCollection).toHaveBeenCalledWith('claim-301', {
        officerNotes: 'Student verified physical ID card and signed custody register',
        linkedLostReportId: 'lost-report-99',
      });
      expect(screen.getByText(/Item Physically Collected and Reunited/i)).toBeInTheDocument();
      expect(screen.getByText(/\+50 points/i)).toBeInTheDocument();
    });
  });

  it('renders returned items page and displays collection receipt details', async () => {
    const mockReturnedItem: FoundItemResponse = {
      id: 'item-801',
      title: 'Casio G-Shock Watch Black',
      description: 'Found in laboratory',
      categoryId: 'cat-1',
      categoryName: 'Watches',
      locationId: 'loc-1',
      locationName: 'Laboratory Complex',
      foundAt: '2026-11-15T10:00:00Z',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      handoverStatus: 'CONFIRMED',
      availabilityStatus: 'RETURNED',
      finderName: 'Anura Bandara',
      receivingOfficerName: 'Officer Jayawardena',
      createdAt: '2026-11-15T11:00:00Z',
      updatedAt: '2026-11-17T15:00:00Z',
      images: [],
    };

    const returnedPageData: Page<FoundItemResponse> = {
      content: [mockReturnedItem],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(officerService.listFoundItems).mockResolvedValue(returnedPageData);
    vi.mocked(officerService.getCollectionByFoundItemId).mockResolvedValue(mockCollectionResponse);

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OfficerReturnedItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Returned Items & Collection History')).toBeInTheDocument();
      expect(screen.getByText('Casio G-Shock Watch Black')).toBeInTheDocument();
    });

    const receiptBtn = screen.getByRole('button', { name: /Collection Receipt/i });
    await user.click(receiptBtn);

    await waitFor(() => {
      expect(screen.getByText('Physical Collection Confirmation Log')).toBeInTheDocument();
      expect(screen.getByText(/Tharindu Gunasekara/i)).toBeInTheDocument();
      expect(screen.getByText(/\+50 points/i)).toBeInTheDocument();
    });
  });
});
