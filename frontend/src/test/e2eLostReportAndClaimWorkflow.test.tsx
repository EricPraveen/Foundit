import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SubmitClaimModal } from '@/features/claims/components/SubmitClaimModal';
import { OfficerClaimDetailPage } from '@/pages/officer/OfficerClaimDetailPage';
import { OfficerCollectionDetailPage } from '@/pages/officer/OfficerCollectionDetailPage';
import { claimService } from '@/features/claims/services/claimService';
import { officerService } from '@/features/officer/services/officerService';
import { AuthProvider } from '@/features/auth';
import type { ClaimResponse } from '@/features/claims/types';

vi.mock('@/features/claims/services/claimService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/claims/services/claimService')>();
  return {
    ...actual,
    claimService: {
      ...actual.claimService,
      submitClaim: vi.fn(),
      getMyClaims: vi.fn(),
      getClaimById: vi.fn(),
    },
  };
});

vi.mock('@/features/officer/services/officerService', () => ({
  officerService: {
    getClaimById: vi.fn(),
    approveClaim: vi.fn(),
    rejectClaim: vi.fn(),
    confirmCollection: vi.fn(),
  },
}));

describe('Workflow Verification: Lost Report and Claim Lifecycles', () => {
  const studentUser = {
    id: 'student-1',
    email: 'dinuka.20@uom.lk',
    fullName: 'Dinuka Jayasuriya',
    role: 'STUDENT' as const,
  };

  const officerUser = {
    id: 'officer-1',
    email: 'officer.suneth@uom.lk',
    fullName: 'Officer Suneth',
    role: 'SECURITY_OFFICER' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Workflow E: Student submits claim with Index Number and mandatory evidence files', async () => {
    const mockCreatedClaim: ClaimResponse = {
      id: 'claim-1',
      foundItemId: 'item-101',
      foundItemTitle: 'Casio fx-991EX Calculator',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      claimant: {
        id: 'student-1',
        fullName: 'Dinuka Jayasuriya',
        email: 'dinuka.20@uom.lk',
        indexNumber: '200112Y',
      },
      ownershipDescription: 'Has a barcode sticker on the back battery cover with initial D.J.',
      status: 'PENDING',
      submittedAt: '2026-11-18T10:00:00Z',
      evidence: [],
      createdAt: '2026-11-18T10:00:00Z',
      updatedAt: '2026-11-18T10:00:00Z',
    };

    vi.mocked(claimService.submitClaim).mockResolvedValue(mockCreatedClaim);

    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <AuthProvider initialUser={studentUser} initialToken="mock-token">
        <SubmitClaimModal
          isOpen={true}
          onClose={handleClose}
          itemId="item-101"
          itemTitle="Casio fx-991EX Calculator"
          onSuccess={handleSuccess}
        />
      </AuthProvider>
    );

    // Verify modal elements
    expect(screen.getByText(/Claim Found Item/i)).toBeInTheDocument();
    expect(screen.getByText(/Casio fx-991EX Calculator/i)).toBeInTheDocument();

    // 1. Fill mandatory Index Number
    const indexInput = screen.getByPlaceholderText('e.g. 210001A');
    await user.type(indexInput, '200112Y');

    // 2. Fill ownership description
    const descInput = screen.getByPlaceholderText(/Explain why this item belongs to you/i);
    await user.type(
      descInput,
      'This is my calculator with a barcode sticker on the back battery cover initialed D.J. Has a scratch on bottom left.'
    );

    // 3. Attach student ID card image (hidden file input, use fireEvent.change)
    const studentIdFile = new File(['mock-id-card-content'], 'student_id.jpg', {
      type: 'image/jpeg',
    });
    const idInput = document.getElementById('student-id-card-upload')!;
    fireEvent.change(idInput, { target: { files: [studentIdFile] } });

    // 4. Attach ownership proof file (hidden file input, use fireEvent.change)
    const proofFile = new File(['mock-proof-content'], 'purchase_receipt.pdf', {
      type: 'application/pdf',
    });
    const proofInput = document.getElementById('ownership-proof-upload')!;
    fireEvent.change(proofInput, { target: { files: [proofFile] } });

    // 5. Submit the claim
    const submitBtn = screen.getByRole('button', { name: /Submit Ownership Claim/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(claimService.submitClaim).toHaveBeenCalledWith(
        'item-101',
        expect.objectContaining({
          indexNumber: '200112Y',
          ownershipDescription: expect.stringContaining('This is my calculator'),
          studentIdCard: studentIdFile,
          ownershipProof: proofFile,
        })
      );
    });

    expect(handleSuccess).toHaveBeenCalledWith(mockCreatedClaim);
  });

  it('Workflow F: Security Officer reviews claim evidence and approves it', async () => {
    const mockOfficerClaim: ClaimResponse = {
      id: 'claim-1',
      foundItemId: 'item-101',
      foundItemTitle: 'Casio fx-991EX Calculator',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      claimant: {
        id: 'student-1',
        fullName: 'Dinuka Jayasuriya',
        email: 'dinuka.20@uom.lk',
        indexNumber: '200112Y',
        phoneNumber: '+94771234567',
      },
      ownershipDescription: 'Has a barcode sticker on the back battery cover with initial D.J.',
      status: 'PENDING',
      rejectionReason: null,
      submittedAt: '2026-11-18T10:00:00Z',
      reviewedAt: null,
      reviewingOfficerId: null,
      reviewingOfficerName: null,
      reviewNotes: null,
      cancelledAt: null,
      evidence: [
        {
          id: 'ev-1',
          claimId: 'claim-1',
          evidenceType: 'STUDENT_ID_CARD',
          originalFilename: 'student_id.jpg',
          contentType: 'image/jpeg',
          fileSize: 10240,
          createdAt: '2026-11-18T10:00:00Z',
        },
      ],
      createdAt: '2026-11-18T10:00:00Z',
      updatedAt: '2026-11-18T10:00:00Z',
    };

    vi.mocked(officerService.getClaimById).mockResolvedValue(mockOfficerClaim);
    vi.mocked(officerService.approveClaim).mockResolvedValue({
      ...mockOfficerClaim,
      status: 'APPROVED',
    });

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={officerUser} initialToken="token-officer">
        <MemoryRouter initialEntries={['/officer/claims/claim-1']}>
          <Routes>
            <Route path="/officer/claims/:claimId" element={<OfficerClaimDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Casio fx-991EX Calculator').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Dinuka Jayasuriya')).toBeInTheDocument();
    expect(screen.getByText('200112Y')).toBeInTheDocument();

    // Verify claim review action buttons
    const approveBtn = screen.getByRole('button', { name: /Approve Claim/i });
    expect(approveBtn).toBeInTheDocument();

    await user.click(approveBtn);

    // Confirm modal
    await waitFor(() => {
      expect(screen.getByText('Approve Ownership Claim')).toBeInTheDocument();
    });

    const confirmApproveBtn = screen.getByRole('button', { name: /^Confirm Approval$/i });
    await user.click(confirmApproveBtn);

    expect(officerService.approveClaim).toHaveBeenCalledWith('claim-1', expect.anything());
  });

  it('Workflow G: Officer confirms physical item collection and claim completes', async () => {
    const mockApprovedClaim: ClaimResponse = {
      id: 'claim-1',
      foundItemId: 'item-101',
      foundItemTitle: 'Casio fx-991EX Calculator',
      designatedSecurityOfficeId: 'office-1',
      designatedSecurityOfficeName: 'Central Security Office',
      claimant: {
        id: 'student-1',
        fullName: 'Dinuka Jayasuriya',
        email: 'dinuka.20@uom.lk',
        indexNumber: '200112Y',
        phoneNumber: '+94771234567',
      },
      ownershipDescription: 'Has barcode sticker',
      status: 'APPROVED',
      rejectionReason: null,
      submittedAt: '2026-11-18T10:00:00Z',
      reviewedAt: '2026-11-18T10:30:00Z',
      reviewingOfficerId: 'officer-1',
      reviewingOfficerName: 'Officer Suneth',
      reviewNotes: null,
      cancelledAt: null,
      evidence: [],
      createdAt: '2026-11-18T10:00:00Z',
      updatedAt: '2026-11-18T10:30:00Z',
    };

    vi.mocked(officerService.getClaimById).mockResolvedValue(mockApprovedClaim);
    vi.mocked(officerService.confirmCollection).mockResolvedValue({
      collectionId: 'collection-1',
      claimId: 'claim-1',
      foundItemId: 'item-101',
      claimantId: 'student-1',
      claimantName: 'Dinuka Jayasuriya',
      claimantEmail: 'dinuka.20@uom.lk',
      confirmingOfficerId: 'officer-1',
      confirmingOfficerName: 'Officer Suneth',
      collectedAt: '2026-11-18T11:00:00Z',
      claimStatus: 'COMPLETED',
      itemAvailabilityStatus: 'RETURNED',
      pointsAwarded: 15,
      officerNotes: 'Verified student ID and physical possession handed over.',
    });

    const user = userEvent.setup();

    render(
      <AuthProvider initialUser={officerUser} initialToken="token-officer">
        <MemoryRouter initialEntries={['/officer/collections/claim-1']}>
          <Routes>
            <Route
              path="/officer/collections/:claimId"
              element={<OfficerCollectionDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Physical Item Handover & Collection')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Casio fx-991EX Calculator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dinuka Jayasuriya').length).toBeGreaterThan(0);
    expect(screen.getAllByText('200112Y').length).toBeGreaterThan(0);

    // Verify confirmation checkboxes (claimant ID check & physical handover)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
    for (const cb of checkboxes) {
      await user.click(cb);
    }

    // Verify collector remarks
    const remarksInput = screen.getByPlaceholderText(/e\.g\. Student inspected item condition/i);
    await user.type(remarksInput, 'Claimant presented original student ID and signed physical register #14.');

    // Submit confirmation
    const submitBtn = screen.getByRole('button', { name: /Confirm Physical Handover & Mark RETURNED/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(officerService.confirmCollection).toHaveBeenCalledWith('claim-1', {
        officerNotes: 'Claimant presented original student ID and signed physical register #14.',
        linkedLostReportId: undefined,
      });
    });
  });
});
