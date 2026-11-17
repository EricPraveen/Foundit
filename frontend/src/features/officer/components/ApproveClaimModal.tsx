import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ClaimResponse, ApproveClaimRequest } from '../types';

export interface ApproveClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ClaimResponse | null;
  onConfirm: (claimId: string, request?: ApproveClaimRequest) => Promise<unknown>;
}

export const ApproveClaimModal: React.FC<ApproveClaimModalProps> = ({
  isOpen,
  onClose,
  claim,
  onConfirm,
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(claim.id, {
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setReviewNotes('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to approve claim. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Approve Ownership Claim</span>
        </div>
      }
      description="Validate that the claimant has established clear proof of ownership."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Approval Conflict or Error">
            {error}
          </Alert>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
          <div>
            <span className="font-semibold text-slate-700">Claimant: </span>
            <span className="text-slate-900 font-medium">{claim.claimant.fullName}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Index Number: </span>
            <span className="text-slate-900 font-mono font-medium">{claim.claimant.indexNumber}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Item: </span>
            <span className="text-slate-800">{claim.foundItemTitle}</span>
          </div>
        </div>

        <Alert variant="warning" title="Concurrency & Custody Rule">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Approving this claim marks the item as <strong>CLAIM_PENDING</strong> and moves the claim to <strong>APPROVED</strong>. Only one approved claim may exist for an item at any time. Claim approval does not mark the item as returned.
            </span>
          </div>
        </Alert>

        <div>
          <label htmlFor="reviewNotes" className="block text-sm font-medium text-slate-700 mb-1">
            Review Officer Notes (Optional)
          </label>
          <textarea
            id="reviewNotes"
            rows={3}
            maxLength={1000}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="e.g. Student ID verified against Dean's list. Distinctive scratch confirmed."
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
          />
          <p className="mt-1 text-xs text-slate-500">Maximum 1,000 characters.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            Confirm Approval
          </Button>
        </div>
      </form>
    </Modal>
  );
};
