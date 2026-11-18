import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { LostReportResponse, CancelLostReportOfficerRequest } from '../types';

export interface CancelLostReportOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LostReportResponse | null;
  onConfirm: (id: string, request?: CancelLostReportOfficerRequest) => Promise<unknown>;
}

export const CancelLostReportOfficerModal: React.FC<CancelLostReportOfficerModalProps> = ({
  isOpen,
  onClose,
  report,
  onConfirm,
}) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(report.id, {
        cancellationReason: cancellationReason.trim() || undefined,
      });
      setCancellationReason('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to cancel lost report. Please try again.');
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
          <span>Cancel Lost Report</span>
        </div>
      }
      description="Cancel an invalid, duplicate, or withdrawn lost report."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1 text-sm">
          <div>
            <span className="font-semibold text-slate-700">Report Title: </span>
            <span className="text-slate-900 font-medium">{report.title}</span>
          </div>
          {report.studentContact && (
            <div>
              <span className="font-semibold text-slate-700">Student: </span>
              <span className="text-slate-800">{report.studentContact.fullName} ({report.studentContact.email})</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="cancellationReason" className="block text-sm font-medium text-slate-700 mb-1">
            Officer Cancellation Reason (Optional)
          </label>
          <textarea
            id="cancellationReason"
            rows={3}
            maxLength={1000}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="e.g. Duplicate report identified; submitted in error."
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Keep Report
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isSubmitting}
            leftIcon={<XCircle className="h-4 w-4" />}
          >
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
