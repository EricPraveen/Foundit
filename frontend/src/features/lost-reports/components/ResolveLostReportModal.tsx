import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { lostReportService } from '../services/lostReportService';
import type { LostReportResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface ResolveLostReportModalProps {
  report: LostReportResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (resolved: LostReportResponse) => void;
}

export const ResolveLostReportModal: React.FC<ResolveLostReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const resolved = await lostReportService.resolveLostReport(report.id, {
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      onSuccess?.(resolved);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resolve lost report.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Lost Report"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Mark Item as Found / Recovered</p>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              Did you recover your <strong>{report.title}</strong>? Resolving this report will close the active search and notify the Security Office.
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
            Resolution Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="e.g. Recovered from the library help desk, or found in my backpack."
            maxLength={1000}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
            <span>Optional details on how the item was recovered</span>
            <span>{resolutionNotes.length}/1000</span>
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
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirm Resolution
          </Button>
        </div>
      </form>
    </Modal>
  );
};
