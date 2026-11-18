import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ClaimResponse, RejectClaimRequest } from '../types';

export interface RejectClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ClaimResponse | null;
  onConfirm: (claimId: string, request: RejectClaimRequest) => Promise<unknown>;
}

export const RejectClaimModal: React.FC<RejectClaimModalProps> = ({
  isOpen,
  onClose,
  claim,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    if (rejectionReason.trim().length > 1000) {
      setError('Rejection reason must not exceed 1,000 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(claim.id, {
        rejectionReason: rejectionReason.trim(),
      });
      setRejectionReason('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reject claim. Please try again.');
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
        <div className="flex items-center gap-2 text-rose-600">
          <XCircle className="h-5 w-5" />
          <span>Reject Ownership Claim</span>
        </div>
      }
      description="Provide an official justification for why this ownership claim cannot be substantiated."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Rejection Error">
            {error}
          </Alert>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
          <div>
            <span className="font-semibold text-slate-700">Claimant: </span>
            <span className="text-slate-900 font-medium">{claim.claimant.fullName}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Item: </span>
            <span className="text-slate-800">{claim.foundItemTitle}</span>
          </div>
        </div>

        <Alert variant="info" title="Student Resubmission Policy">
          The student will be notified with your rejection reason. University policy allows claimants to resubmit a claim with updated or additional ownership evidence.
        </Alert>

        <div>
          <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700 mb-1">
            Official Rejection Reason <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="rejectionReason"
            rows={4}
            required
            maxLength={1000}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Specify why the evidence was insufficient (e.g. Student ID does not match index number; photo proof does not match item serial/model)."
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-slate-500">Required. Maximum 1,000 characters.</p>
            <span className="text-xs text-slate-400">{rejectionReason.length}/1000</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            leftIcon={<XCircle className="h-4 w-4" />}
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};
