import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { LostReportResponse, ResolveLostReportOfficerRequest } from '../types';

export interface ResolveLostReportOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LostReportResponse | null;
  onConfirm: (id: string, request?: ResolveLostReportOfficerRequest) => Promise<unknown>;
}

export const ResolveLostReportOfficerModal: React.FC<ResolveLostReportOfficerModalProps> = ({
  isOpen,
  onClose,
  report,
  onConfirm,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(report.id, {
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      setResolutionNotes('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resolve lost report. Please try again.');
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
          <span>Resolve Lost Report</span>
        </div>
      }
      description="Mark this private lost report as resolved after operational assistance or physical item recovery."
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
          <div>
            <span className="font-semibold text-slate-700">Current Status: </span>
            <span className="font-mono text-xs uppercase text-slate-800">{report.status}</span>
          </div>
        </div>

        <div>
          <label htmlFor="resolutionNotes" className="block text-sm font-medium text-slate-700 mb-1">
            Officer Resolution Notes (Optional)
          </label>
          <textarea
            id="resolutionNotes"
            rows={3}
            maxLength={1000}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="e.g. Student confirmed finding the item in Department laboratory."
            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
          />
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
            Mark as Resolved
          </Button>
        </div>
      </form>
    </Modal>
  );
};
