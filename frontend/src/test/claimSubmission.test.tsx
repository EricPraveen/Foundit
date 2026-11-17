import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmitClaimModal } from '@/features/claims/components/SubmitClaimModal';
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
      submitClaim: vi.fn(),
    },
  };
});

describe('SubmitClaimModal Component', () => {
  const mockClaimResponse: ClaimResponse = {
    id: 'claim-uuid-999',
    foundItemId: 'item-uuid-111',
    foundItemTitle: 'iPhone 13 Midnight Black',
    designatedSecurityOfficeId: 'office-1',
    designatedSecurityOfficeName: 'Central Security Office',
    claimant: {
      id: 'student-1',
      fullName: 'John Doe',
      email: 'john@uom.lk',
      indexNumber: '210001A',
    },
    ownershipDescription: 'This is my personal phone. Lockscreen shows my dog.',
    status: 'PENDING',
    submittedAt: '2026-11-15T10:00:00Z',
    evidence: [
      {
        id: 'ev-1',
        claimId: 'claim-uuid-999',
        evidenceType: 'STUDENT_ID_CARD',
        originalFilename: 'student_id.png',
        contentType: 'image/png',
        fileSize: 1024,
        createdAt: '2026-11-15T10:00:00Z',
      },
      {
        id: 'ev-2',
        claimId: 'claim-uuid-999',
        evidenceType: 'OWNERSHIP_PROOF',
        originalFilename: 'invoice.pdf',
        contentType: 'application/pdf',
        fileSize: 2048,
        createdAt: '2026-11-15T10:00:00Z',
      },
    ],
    createdAt: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(claimService.submitClaim).mockResolvedValue(mockClaimResponse);
  });

  it('renders modal with privacy evidence warning, item title, and reviewing office', () => {
    render(
      <SubmitClaimModal
        itemId="item-uuid-111"
        itemTitle="iPhone 13 Midnight Black"
        securityOfficeName="Central Security Office"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Claim Found Item')).toBeInTheDocument();
    expect(screen.getByText('Private Evidence Protection')).toBeInTheDocument();
    expect(screen.getByText(/Central Security Office/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/University Index Number \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Ownership Description & Distinctive Details \*/i)).toBeInTheDocument();
  });

  it('validates index number, description minimum length, and mandatory evidence files on submit', async () => {
    const user = userEvent.setup();
    render(
      <SubmitClaimModal
        itemId="item-uuid-111"
        itemTitle="iPhone 13 Midnight Black"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Ownership Claim/i });
    await user.click(submitBtn);

    expect(await screen.findByText('University Index Number is required')).toBeInTheDocument();
    expect(screen.getByText('Ownership description is required')).toBeInTheDocument();
    expect(screen.getByText('Student ID Card is required')).toBeInTheDocument();
    expect(screen.getByText('Ownership Proof is required')).toBeInTheDocument();
    expect(claimService.submitClaim).not.toHaveBeenCalled();
  });

  it('rejects ownership description shorter than 10 characters', async () => {
    const user = userEvent.setup();
    render(
      <SubmitClaimModal
        itemId="item-uuid-111"
        itemTitle="iPhone 13 Midnight Black"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/University Index Number \*/i), '210001A');
    const descInput = screen.getByPlaceholderText(/Explain why this item belongs to you/i);
    await user.type(descInput, 'My phone');

    await user.click(screen.getByRole('button', { name: /Submit Ownership Claim/i }));

    expect(
      await screen.findByText(/Please provide at least 10 characters describing why this item is yours/i)
    ).toBeInTheDocument();
    expect(claimService.submitClaim).not.toHaveBeenCalled();
  });

  it('submits valid claim with student ID and ownership proof files', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <SubmitClaimModal
        itemId="item-uuid-111"
        itemTitle="iPhone 13 Midnight Black"
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    await user.type(screen.getByLabelText(/University Index Number \*/i), '210001A');
    const descInput = screen.getByPlaceholderText(/Explain why this item belongs to you/i);
    await user.type(descInput, 'This is my iPhone 13. Lockscreen shows my dog.');

    // Upload Student ID
    const studentIdFile = new File(['student-id'], 'id_card.png', { type: 'image/png' });
    const studentIdInput = document.getElementById('student-id-card-upload') as HTMLInputElement;
    Object.defineProperty(studentIdInput, 'files', {
      value: [studentIdFile],
      writable: true,
    });
    studentIdInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Upload Proof
    const proofFile = new File(['receipt-pdf'], 'receipt.pdf', { type: 'application/pdf' });
    const proofInput = document.getElementById('ownership-proof-upload') as HTMLInputElement;
    Object.defineProperty(proofInput, 'files', {
      value: [proofFile],
      writable: true,
    });
    proofInput.dispatchEvent(new Event('change', { bubbles: true }));

    await user.click(screen.getByRole('button', { name: /Submit Ownership Claim/i }));

    await waitFor(() => {
      expect(claimService.submitClaim).toHaveBeenCalledWith(
        'item-uuid-111',
        expect.objectContaining({
          indexNumber: '210001A',
          ownershipDescription: 'This is my iPhone 13. Lockscreen shows my dog.',
          studentIdCard: studentIdFile,
          ownershipProof: proofFile,
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(mockClaimResponse);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles 409 conflict when active claim already exists for the item', async () => {
    const user = userEvent.setup();
    vi.mocked(claimService.submitClaim).mockRejectedValue(
      new ApiError({
        timestamp: new Date().toISOString(),
        status: 409,
        error: 'Conflict',
        message: 'You already have an active claim pending review for this item.',
        path: '/api/v1/found-items/item-uuid-111/claims',
      })
    );

    render(
      <SubmitClaimModal
        itemId="item-uuid-111"
        itemTitle="iPhone 13 Midnight Black"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/University Index Number \*/i), '210001A');
    const descInput = screen.getByPlaceholderText(/Explain why this item belongs to you/i);
    await user.type(descInput, 'This is my iPhone 13. Lockscreen shows my dog.');

    const studentIdFile = new File(['student-id'], 'id_card.png', { type: 'image/png' });
    const studentIdInput = document.getElementById('student-id-card-upload') as HTMLInputElement;
    Object.defineProperty(studentIdInput, 'files', { value: [studentIdFile], writable: true });
    studentIdInput.dispatchEvent(new Event('change', { bubbles: true }));

    const proofFile = new File(['receipt-pdf'], 'receipt.pdf', { type: 'application/pdf' });
    const proofInput = document.getElementById('ownership-proof-upload') as HTMLInputElement;
    Object.defineProperty(proofInput, 'files', { value: [proofFile], writable: true });
    proofInput.dispatchEvent(new Event('change', { bubbles: true }));

    await user.click(screen.getByRole('button', { name: /Submit Ownership Claim/i }));

    expect(
      await screen.findByText('You already have an active claim pending review for this item.')
    ).toBeInTheDocument();
  });
});
