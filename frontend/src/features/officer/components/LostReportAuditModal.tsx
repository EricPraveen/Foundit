import React, { useState, useEffect } from 'react';
import { History, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { officerService } from '../services/officerService';
import type { LostReportAuditLogResponse } from '../types';

export interface LostReportAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  reportTitle?: string;
}

export const LostReportAuditModal: React.FC<LostReportAuditModalProps> = ({
  isOpen,
  onClose,
  reportId,
  reportTitle,
}) => {
  const [history, setHistory] = useState<LostReportAuditLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !reportId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    officerService
      .getLostReportAuditHistory(reportId)
      .then((data) => {
        if (isMounted) setHistory(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load lost report audit logs.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, reportId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-campus-700" />
          <span>Lost Report Lifecycle Audit Trail</span>
        </div>
      }
      description={reportTitle ? `Audit history for: ${reportTitle}` : 'Immutable lifecycle history.'}
      size="lg"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingIndicator size="md" message="Loading audit records..." />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : history.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6 text-slate-400" />}
            title="No Audit Records"
            description="No lifecycle transitions recorded yet for this report."
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {history.map((log) => (
              <div key={log.id} className="p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <Badge variant="outline" size="sm">
                      {log.actorRole}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span>Status:</span>
                  {log.previousStatus && (
                    <span className="font-mono text-slate-500">{log.previousStatus} &rarr;</span>
                  )}
                  <span className="font-mono font-medium text-slate-900">{log.newStatus}</span>
                </div>
                {log.details && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-100 mt-1">
                    "{log.details}"
                  </p>
                )}
                <div className="text-[11px] text-slate-400 font-mono">
                  Log ID: {log.id}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
