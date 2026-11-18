import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/lib/utils/formatters';
import type { AuditLogResponse } from '../types';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogResponse | null;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!log) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Trail Record Details"
      size="lg"
    >
      <div className="space-y-4">
        <Alert variant="info" title="Immutable System Audit Trail">
          This record is stored in the append-only system audit log. Sensitive fields such
          as credentials, tokens, and private claimant documents are permanently sanitized
          and excluded from audit storage.
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Action Name
            </span>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
              {log.action}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Event Outcome
            </span>
            <div className="mt-0.5">
              <Badge variant={log.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                {log.outcome}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actor Identity
            </span>
            <p className="mt-0.5 font-medium text-slate-900">
              {log.actorEmail || 'System Process'}
            </p>
            {log.actorRole && (
              <span className="text-xs text-slate-500 font-mono">
                Role: {log.actorRole}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Entity
            </span>
            <p className="mt-0.5 font-medium text-slate-900">
              {log.entityType}{' '}
              {log.entityId && (
                <span className="font-mono text-xs text-slate-500">
                  (ID: {log.entityId})
                </span>
              )}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Timestamp (UTC / Local)
            </span>
            <p className="mt-0.5 text-xs text-slate-700">
              {formatDate(log.createdAt)}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Client IP Address
            </span>
            <p className="mt-0.5 font-mono text-xs text-slate-700">
              {log.ipAddress || 'Internal / N/A'}
            </p>
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Audit Metadata & Details
          </span>
          <div className="rounded-md border border-slate-200 bg-slate-900 p-3.5 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-48">
            {log.metadata || 'No additional metadata recorded.'}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
