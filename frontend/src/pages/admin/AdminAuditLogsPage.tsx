import React from 'react';
import { ScrollText } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const AdminAuditLogsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Trail</h1>
        <p className="mt-1 text-sm text-slate-500">
          Append-only immutable audit trail for security events, transitions, and user operations.
        </p>
      </div>
      <EmptyState
        icon={<ScrollText className="h-6 w-6" />}
        title="Audit Logs Inspector"
        description="Search and filter sanitized system audit logs in FRONTEND-07 (#105)."
      />
    </PageContainer>
  );
};
export default AdminAuditLogsPage;
