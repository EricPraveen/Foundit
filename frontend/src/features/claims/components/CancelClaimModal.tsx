import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { claimService } from '../services/claimService';
import type { ClaimResponse, ClaimSummaryResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface CancelClaimModalProps {
  claim: ClaimSummaryResponse | ClaimResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cancelled: ClaimResponse) => void;
}

export const CancelClaimModal: React.FC<CancelClaimModalProps> = ({
  claim,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !claim) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await claimService.cancelClaim(claim.id);
      onSuccess?.(response);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to cancel claim.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Ownership Claim"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-950">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Withdraw Claim</p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              Are you sure you want to cancel your claim for <strong>{claim.foundItemTitle}</strong>?
              The reviewing officer will be notified and this claim will no longer be considered.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="danger">
            <p className="text-xs">{error}</p>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Claim
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm Withdrawal
          </Button>
        </div>
      </div>
    </Modal>
  );
};
