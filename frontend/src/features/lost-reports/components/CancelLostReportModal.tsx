import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { lostReportService } from '../services/lostReportService';
import type { LostReportResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface CancelLostReportModalProps {
  report: LostReportResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cancelled: LostReportResponse) => void;
}

export const CancelLostReportModal: React.FC<CancelLostReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const cancelled = await lostReportService.cancelLostReport(report.id, {
        cancellationReason: cancellationReason.trim() || undefined,
      });
      onSuccess?.(cancelled);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to cancel lost report.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Lost Report"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-950">
          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Withdraw Lost Report</p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              Are you sure you want to cancel the lost report for <strong>{report.title}</strong>? Once cancelled, the active inquiry will be closed.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="danger">
            <p className="text-xs">{error}</p>
          </Alert>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Cancellation (Optional)
          </label>
          <textarea
            rows={3}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g. Reported by mistake, no longer looking for this item."
            maxLength={1000}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
            <span>Optional explanation for the Security Office</span>
            <span>{cancellationReason.length}/1000</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Report
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
