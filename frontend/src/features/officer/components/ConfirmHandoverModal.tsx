import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { FoundItemResponse, ConfirmHandoverRequest } from '../types';

export interface ConfirmHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FoundItemResponse | null;
  onConfirm: (id: string, request?: ConfirmHandoverRequest) => Promise<unknown>;
}

export const ConfirmHandoverModal: React.FC<ConfirmHandoverModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
}) => {
  const [officerNotes, setOfficerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(item.id, {
        officerNotes: officerNotes.trim() || undefined,
      });
      setOfficerNotes('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to confirm physical handover. Please try again.');
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
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span>Confirm Physical Handover</span>
        </div>
      }
      description="Verify that the finder has physically brought this item to the Central Security Office safe."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Handover Error">
            {error}
          </Alert>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
          <div>
            <span className="font-semibold text-slate-700">Item: </span>
            <span className="text-slate-900 font-medium">{item.title}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Category: </span>
            <span className="text-slate-800">{item.categoryName}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Discovered Location: </span>
            <span className="text-slate-800">{item.locationName}</span>
          </div>
          {item.finderName && (
            <div>
              <span className="font-semibold text-slate-700">Reported By: </span>
              <span className="text-slate-800">{item.finderName}</span>
            </div>
          )}
        </div>

        <Alert variant="info" title="Business Rule Notice">
          Confirming receipt will transition this item from <strong>PENDING_HANDOVER</strong> to <strong>AVAILABLE</strong>, publishing it to the student browsing catalog and awarding reputation points to the finder.
        </Alert>

        <div>
          <label htmlFor="officerNotes" className="block text-sm font-medium text-slate-700 mb-1">
            Officer Custody Notes (Optional)
          </label>
          <textarea
            id="officerNotes"
            rows={3}
            maxLength={2000}
            value={officerNotes}
            onChange={(e) => setOfficerNotes(e.target.value)}
            placeholder="e.g. Received in good condition, stored in Safe Bin #4."
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
          />
          <p className="mt-1 text-xs text-slate-500">Maximum 2,000 characters.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<ShieldCheck className="h-4 w-4" />}
          >
            Confirm Receipt & Make Available
          </Button>
        </div>
      </form>
    </Modal>
  );
};
