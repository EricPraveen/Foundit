import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OfficerClaimsPage } from '@/pages/officer/OfficerClaimsPage';
import { OfficerClaimDetailPage } from '@/pages/officer/OfficerClaimDetailPage';
import { officerService } from '@/features/officer/services/officerService';
import type { ClaimResponse } from '@/features/officer/types';
import type { Page } from '@/types/api';

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    listClaims: vi.fn(),
    getClaimById: vi.fn(),
    approveClaim: vi.fn(),
    rejectClaim: vi.fn(),
    downloadEvidence: vi.fn(),
    getCollectionByClaimId: vi.fn(),
  },
}));

describe('Officer Claims Review Desk & Evidence Evaluation', () => {
  const mockClaim: ClaimResponse = {
    id: 'claim-201',
    foundItemId: 'item-501',
    foundItemTitle: 'Apple MacBook Air M2 13-inch Space Gray',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    claimant: {
      id: 'student-202',
      fullName: 'Ravi Wickramasinghe',
      email: 'ravi.w@uom.lk',
      phoneNumber: '+94719876543',
      indexNumber: '210543X',
    },
    ownershipDescription: 'MacBook Air with slight dent on left corner and university sticker on lid',
    status: 'PENDING',
    reviewingOfficerId: null,
    reviewingOfficerName: null,
    reviewNotes: null,
    rejectionReason: null,
    submittedAt: '2026-11-17T09:00:00Z',
    reviewedAt: null,
    cancelledAt: null,
    evidence: [
      {
        id: 'ev-1',
        claimId: 'claim-201',
        evidenceType: 'STUDENT_ID_CARD',
        originalFilename: 'student_id_card.png',
        contentType: 'image/png',
        fileSize: 1024 * 350,
        createdAt: '2026-11-17T09:00:00Z',
      },
      {
        id: 'ev-2',
        claimId: 'claim-201',
        evidenceType: 'OWNERSHIP_PROOF',
        originalFilename: 'apple_store_invoice.pdf',
        contentType: 'application/pdf',
        fileSize: 1024 * 820,
        createdAt: '2026-11-17T09:00:00Z',
      },
    ],
    createdAt: '2026-11-17T09:00:00Z',
    updatedAt: '2026-11-17T09:00:00Z',
  };

  const mockPageData: Page<ClaimResponse> = {
    content: [mockClaim],
    totalElements: 1,
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

  it('renders claims queue with sensitive identity index number and privacy directive', async () => {
    vi.mocked(officerService.listClaims).mockResolvedValue(mockPageData);

    render(
      <MemoryRouter>
        <OfficerClaimsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ownership Claims Review Desk')).toBeInTheDocument();
    });

    // Privacy alert
    expect(screen.getByText(/Sensitive Evidence Authorization/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Claim review involves confidential university records/i)
    ).toBeInTheDocument();

    // Claim details
    expect(
      screen.getByText('Apple MacBook Air M2 13-inch Space Gray')
    ).toBeInTheDocument();
    expect(screen.getByText('Ravi Wickramasinghe')).toBeInTheDocument();
    expect(screen.getByText('210543X')).toBeInTheDocument();
    expect(screen.getByText('UNDER REVIEW')).toBeInTheDocument();
  });

  it('officer approves claim with review notes and handles reservation', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.listClaims).mockResolvedValue(mockPageData);

    const approvedClaim: ClaimResponse = {
      ...mockClaim,
      status: 'APPROVED',
      reviewingOfficerName: 'Officer Jayawardena',
      reviewedAt: '2026-11-17T11:00:00Z',
      reviewNotes: 'Student ID and Apple Store invoice verified successfully',
    };
    vi.mocked(officerService.approveClaim).mockResolvedValue(approvedClaim);

    render(
      <MemoryRouter>
        <OfficerClaimsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Apple MacBook Air M2 13-inch Space Gray')
      ).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /^Approve$/i });
    await user.click(approveBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Approve Ownership Claim')).toBeInTheDocument();
      expect(screen.getByText(/Concurrency & Custody Rule/i)).toBeInTheDocument();
    });

    const notesInput = screen.getByLabelText(/Review Officer Notes/i);
    await user.type(notesInput, 'Student ID and Apple Store invoice verified successfully');

    const submitBtn = screen.getByRole('button', { name: /Confirm Approval/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(officerService.approveClaim).toHaveBeenCalledWith('claim-201', {
        reviewNotes: 'Student ID and Apple Store invoice verified successfully',
      });
      expect(screen.getByText(/Decision Recorded/i)).toBeInTheDocument();
    });
  });

  it('officer rejects claim with mandatory rejection reason', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.listClaims).mockResolvedValue(mockPageData);

    const rejectedClaim: ClaimResponse = {
      ...mockClaim,
      status: 'REJECTED',
      rejectionReason: 'Invoice serial number does not match device serial number.',
    };
    vi.mocked(officerService.rejectClaim).mockResolvedValue(rejectedClaim);

    render(
      <MemoryRouter>
        <OfficerClaimsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Apple MacBook Air M2 13-inch Space Gray')
      ).toBeInTheDocument();
    });

    const rejectBtn = screen.getByRole('button', { name: /^Reject$/i });
    await user.click(rejectBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Reject Ownership Claim')).toBeInTheDocument();
      expect(screen.getByText(/Student Resubmission Policy/i)).toBeInTheDocument();
    });

    // Enter rejection reason
    const reasonInput = screen.getByLabelText(/Official Rejection Reason/i);
    await user.type(
      reasonInput,
      'Invoice serial number does not match device serial number.'
    );

    const submitBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(officerService.rejectClaim).toHaveBeenCalledWith('claim-201', {
        rejectionReason: 'Invoice serial number does not match device serial number.',
      });
      expect(screen.getByText(/has been rejected/i)).toBeInTheDocument();
    });
  });

  it('inspects claim detail and opens secure evidence viewer with blob streaming', async () => {
    const user = userEvent.setup();
    vi.mocked(officerService.getClaimById).mockResolvedValue(mockClaim);
    vi.mocked(officerService.downloadEvidence).mockResolvedValue(
      new Blob(['fake-image-bytes'], { type: 'image/png' })
    );

    render(
      <MemoryRouter initialEntries={['/officer/claims/claim-201']}>
        <Routes>
          <Route path="/officer/claims/:claimId" element={<OfficerClaimDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Claim for: Apple MacBook Air M2 13-inch Space Gray/i)
      ).toBeInTheDocument();
      expect(screen.getByText('210543X')).toBeInTheDocument();
      expect(screen.getByText('student_id_card.png')).toBeInTheDocument();
    });

    // Open evidence modal
    const viewEvidenceBtn = screen.getByRole('button', { name: /View Evidence/i });
    await user.click(viewEvidenceBtn);

    await waitFor(() => {
      expect(screen.getByText('Confidential Ownership Evidence')).toBeInTheDocument();
      expect(screen.getAllByText('student_id_card.png').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('apple_store_invoice.pdf').length).toBeGreaterThanOrEqual(1);
    });
  });
});
