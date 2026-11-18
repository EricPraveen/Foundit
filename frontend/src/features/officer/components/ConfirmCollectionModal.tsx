import React, { useState } from 'react';
import { PackageCheck, CheckSquare, Square } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ClaimResponse, ConfirmCollectionRequest, CollectionConfirmationResponse } from '../types';

export interface ConfirmCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ClaimResponse | null;
  onConfirm: (
    claimId: string,
    request?: ConfirmCollectionRequest
  ) => Promise<CollectionConfirmationResponse>;
  onSuccess?: (response: CollectionConfirmationResponse) => void;
}

export const ConfirmCollectionModal: React.FC<ConfirmCollectionModalProps> = ({
  isOpen,
  onClose,
  claim,
  onConfirm,
  onSuccess,
}) => {
  const [officerNotes, setOfficerNotes] = useState('');
  const [linkedLostReportId, setLinkedLostReportId] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [itemHandedOver, setItemHandedOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!claim) return null;

  const allChecklistItemsConfirmed = idVerified && itemHandedOver;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecklistItemsConfirmed) {
      setError('You must physically verify the claimant ID card and handover the physical item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await onConfirm(claim.id, {
        officerNotes: officerNotes.trim() || undefined,
        linkedLostReportId: linkedLostReportId.trim() || undefined,
      });
      setOfficerNotes('');
      setLinkedLostReportId('');
      setIdVerified(false);
      setItemHandedOver(false);
      onClose();
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to confirm physical collection. Please try again.');
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
          <PackageCheck className="h-5 w-5 text-emerald-600" />
          <span>Confirm Physical Item Collection</span>
        </div>
      }
      description="Record the in-person handover of the claimed item to the verified claimant at the Central Security Office."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Collection Error">
            {error}
          </Alert>
        )}

        {/* Verification Summary Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-slate-700">Claimant: </span>
              <span className="text-slate-900 font-medium">{claim.claimant.fullName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Index Number: </span>
              <span className="text-slate-900 font-mono font-medium">{claim.claimant.indexNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Student Email: </span>
              <span className="text-slate-800">{claim.claimant.email}</span>
            </div>
            {claim.claimant.phoneNumber && (
              <div>
                <span className="font-semibold text-slate-700">Phone: </span>
                <span className="text-slate-800">{claim.claimant.phoneNumber}</span>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="font-semibold text-slate-700">Item: </span>
              <span className="text-slate-900 font-medium">{claim.foundItemTitle}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Physical Verification Checklist */}
        <div className="rounded-lg border border-campus-200 bg-campus-50/50 p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-campus-900">
            Mandatory Physical Verification Checklist
          </h4>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={idVerified}
              onChange={(e) => setIdVerified(e.target.checked)}
              className="sr-only"
            />
            {idVerified ? (
              <CheckSquare className="h-5 w-5 text-campus-900 shrink-0 mt-0.5" />
            ) : (
              <Square className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span className="text-sm text-slate-800">
              I have physically inspected the student's <strong>University Student ID Card</strong> and verified that the Index Number matches <strong>{claim.claimant.indexNumber}</strong>.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={itemHandedOver}
              onChange={(e) => setItemHandedOver(e.target.checked)}
              className="sr-only"
            />
            {itemHandedOver ? (
              <CheckSquare className="h-5 w-5 text-campus-900 shrink-0 mt-0.5" />
            ) : (
              <Square className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span className="text-sm text-slate-800">
              The physical item has been retrieved from the Security Office custody safe and handed over to the claimant in person.
            </span>
          </label>
        </div>

        <Alert variant="info" title="Terminal Status Transition">
          Confirming collection atomically completes the claim (<strong>COMPLETED</strong>), marks the item as <strong>RETURNED</strong>, updates any linked lost report to <strong>RECOVERED</strong>, and awards category reputation points.
        </Alert>

        <div>
          <label htmlFor="officerCollectionNotes" className="block text-sm font-medium text-slate-700 mb-1">
            Officer Collection Notes (Optional)
          </label>
          <textarea
            id="officerCollectionNotes"
            rows={2}
            maxLength={1000}
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            placeholder="e.g. Claimant confirmed item functionality and signed custody log #204."
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
          />
        </div>

        <div>
          <label htmlFor="linkedLostReportId" className="block text-sm font-medium text-slate-700 mb-1">
            Linked Lost Report ID (Optional)
          </label>
          <input
            id="linkedLostReportId"
            type="text"
            value={linkedLostReportId}
            onChange={(e) => setLinkedLostReportId(e.target.value)}
            placeholder="UUID of claimant's matching private lost report (if known)"
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700 font-mono text-xs"
          />
          <p className="mt-1 text-xs text-slate-500">
            If provided, this lost report will automatically transition to RECOVERED.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!allChecklistItemsConfirmed}
            isLoading={isSubmitting}
            leftIcon={<PackageCheck className="h-4 w-4" />}
          >
            Confirm Collection & Close Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
};
