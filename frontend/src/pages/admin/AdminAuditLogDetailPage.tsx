import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScrollText, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAdminAuditLog } from '@/features/admin';
import { formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/routes/paths';

export const AdminAuditLogDetailPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const { data: log, isLoading, isError, error } = useAdminAuditLog(auditId);

  return (
    <PageContainer>
      {/* Back button */}
      <div className="mb-4">
        <Link
          to={ROUTES.ADMIN.AUDIT_LOGS}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to System Audit Trail
        </Link>
      </div>

      {isError && (
        <Alert variant="danger" title="Audit Record Not Found" className="mb-6">
          {error || 'Could not retrieve this audit record.'}
        </Alert>
      )}

      {isLoading ? (
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
      ) : log ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <ScrollText className="h-6 w-6 text-indigo-700" />
                  <h1 className="text-xl font-bold font-mono text-slate-900">{log.action}</h1>
                  <Badge variant={log.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                    {log.outcome}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-400">Record ID: {log.id}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-white p-6 border border-slate-200 shadow-sm text-sm">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Actor Identity
              </span>
              <p className="mt-0.5 font-medium text-slate-900">{log.actorEmail || 'System Process'}</p>
              {log.actorRole && (
                <span className="text-xs text-slate-500 font-mono">Role: {log.actorRole}</span>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Target Entity
              </span>
              <p className="mt-0.5 font-medium text-slate-900">
                {log.entityType}{' '}
                {log.entityId && (
                  <span className="font-mono text-xs text-slate-500">(ID: {log.entityId})</span>
                )}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Timestamp
              </span>
              <p className="mt-0.5 text-xs text-slate-700 font-mono">{formatDate(log.createdAt)}</p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Client IP Address
              </span>
              <p className="mt-0.5 font-mono text-xs text-slate-700">{log.ipAddress || 'Internal / N/A'}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 border border-slate-200 shadow-sm">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Sanitized Audit Metadata & Details
            </span>
            <div className="rounded-md border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              {log.metadata || 'No additional metadata recorded.'}
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};

export default AdminAuditLogDetailPage;
