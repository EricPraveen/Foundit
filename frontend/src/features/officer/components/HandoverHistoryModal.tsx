import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { officerService } from '../services/officerService';
import type { HandoverLogResponse } from '../types';

export interface HandoverHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  itemTitle?: string;
}

export const HandoverHistoryModal: React.FC<HandoverHistoryModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemTitle,
}) => {
  const [history, setHistory] = useState<HandoverLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !itemId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    officerService
      .getHandoverHistory(itemId)
      .then((data) => {
        if (isMounted) setHistory(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load handover history.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, itemId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-campus-700" />
          <span>Handover Custody History</span>
        </div>
      }
      description={itemTitle ? `Audit log for: ${itemTitle}` : 'Immutable chain-of-custody records.'}
      size="md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingIndicator size="md" message="Loading handover records..." />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : history.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6 text-slate-400" />}
            title="No Handover Records Yet"
            description="This item has not yet been physically verified or handed over."
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {history.map((log) => (
              <div key={log.id} className="p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Physical Custody Confirmed
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(log.handoverConfirmedAt).toLocaleString()}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-100 mt-1">
                    "{log.notes}"
                  </p>
                )}
                <div className="text-[11px] text-slate-400 font-mono">
                  Record ID: {log.id}
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
