import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClaimDetailPage } from '@/pages/app/ClaimDetailPage';
import { claimService } from '@/features/claims/services/claimService';
import type { ClaimResponse } from '@/features/claims/types';
import { ApiError } from '@/lib/api/apiError';

vi.mock('@/features/claims/services/claimService', async () => {
  const actual = await vi.importActual<typeof import('@/features/claims/services/claimService')>(
    '@/features/claims/services/claimService'
  );
  return {
    ...actual,
    claimService: {
      ...actual.claimService,
      getClaimById: vi.fn(),
      cancelClaim: vi.fn(),
      downloadEvidence: vi.fn(),
    },
  };
});

describe('ClaimDetailPage Component', () => {
  const mockApprovedClaim: ClaimResponse = {
    id: 'claim-101',
    foundItemId: 'item-202',
    foundItemTitle: 'Sony WH-1000XM4 Noise Canceling Headphones',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    claimant: {
      id: 'student-1',
      fullName: 'Alice Walker',
      email: 'alice@uom.lk',
      indexNumber: '210045C',
    },
    ownershipDescription: 'Matte black headphones with blue tape on right hinge.',
    status: 'APPROVED',
    reviewingOfficerId: 'officer-9',
    reviewingOfficerName: 'Sergeant Perera',
    reviewNotes: 'Serial number verified against official Sony invoice.',
    submittedAt: '2026-11-14T09:00:00Z',
    reviewedAt: '2026-11-15T10:00:00Z',
    evidence: [
      {
        id: 'ev-1',
        claimId: 'claim-101',
        evidenceType: 'STUDENT_ID_CARD',
        originalFilename: 'alice_id.jpg',
        contentType: 'image/jpeg',
        fileSize: 1048576,
        createdAt: '2026-11-14T09:00:00Z',
      },
      {
        id: 'ev-2',
        claimId: 'claim-101',
        evidenceType: 'OWNERSHIP_PROOF',
        originalFilename: 'sony_receipt.pdf',
        contentType: 'application/pdf',
        fileSize: 2097152,
        createdAt: '2026-11-14T09:00:00Z',
      },
    ],
    createdAt: '2026-11-14T09:00:00Z',
    updatedAt: '2026-11-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (claimId = 'claim-101') => {
    return render(
      <MemoryRouter initialEntries={[`/claims/${claimId}`]}>
        <Routes>
          <Route path="/claims/:id" element={<ClaimDetailPage />} />
          <Route path="/claims" element={<div>My Claims List View</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders approved claim details with physical collection guidance and officer notes', async () => {
    vi.mocked(claimService.getClaimById).mockResolvedValue(mockApprovedClaim);

    renderWithRouter();

    expect(await screen.findByText('Sony WH-1000XM4 Noise Canceling Headphones')).toBeInTheDocument();
    expect(screen.getByText('Approved for Collection')).toBeInTheDocument();
    expect(screen.getByText(/Ownership Confirmed — Ready for Collection/i)).toBeInTheDocument();
    expect(screen.getByText(/Bring your physical University Student ID card/i)).toBeInTheDocument();
    expect(screen.getByText(/Serial number verified against official Sony invoice/i)).toBeInTheDocument();
    expect(screen.getByText('210045C')).toBeInTheDocument();
    expect(screen.getAllByText('Central Security Office').length).toBeGreaterThan(0);
  });

  it('renders rejected claim with officer rejection reason and resubmit action', async () => {
    const mockRejectedClaim: ClaimResponse = {
      ...mockApprovedClaim,
      id: 'claim-102',
      status: 'REJECTED',
      rejectionReason: 'Serial number on invoice does not match the recovered item.',
    };
    vi.mocked(claimService.getClaimById).mockResolvedValue(mockRejectedClaim);

    renderWithRouter('claim-102');

    expect(await screen.findByText('Claim Not Approved')).toBeInTheDocument();
    expect(
      screen.getByText(/Serial number on invoice does not match the recovered item./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit New Claim with Fresh Evidence/i })).toBeInTheDocument();
  });

  it('displays anti-IDOR 404 message when unauthorized or nonexistent claim is requested', async () => {
    vi.mocked(claimService.getClaimById).mockRejectedValue(
      new ApiError({
        timestamp: new Date().toISOString(),
        status: 404,
        error: 'Not Found',
        message: 'Claim not found or access restricted.',
        path: '/api/v1/claims/other-student-claim',
      })
    );

    renderWithRouter('other-student-claim');

    expect(await screen.findByText('Claim Not Found or Access Restricted')).toBeInTheDocument();
    expect(screen.getByText(/Claim evidence and claimant identity are protected against unauthorized enumeration/i)).toBeInTheDocument();
  });

  it('triggers evidence download when clicking download button', async () => {
    const user = userEvent.setup();
    vi.mocked(claimService.getClaimById).mockResolvedValue(mockApprovedClaim);
    const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
    vi.mocked(claimService.downloadEvidence).mockResolvedValue(mockBlob);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-evidence-url');
    window.URL.revokeObjectURL = vi.fn();

    renderWithRouter();

    await screen.findByText('Sony WH-1000XM4 Noise Canceling Headphones');

    const downloadButtons = screen.getAllByRole('button', { name: /Download/i });
    expect(downloadButtons.length).toBe(2);

    await user.click(downloadButtons[0]);

    await waitFor(() => {
      expect(claimService.downloadEvidence).toHaveBeenCalledWith('claim-101', 'ev-1');
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });
});
