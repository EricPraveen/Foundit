import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const ClaimsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Ownership Claims</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review submitted claims, Student ID evidence, and collection scheduling.
        </p>
      </div>
      <EmptyState
        icon={<ClipboardCheck className="h-6 w-6" />}
        title="Claims Management Workspace"
        description="Claim submission with Student ID and ownership evidence, status tracking, and collection flows will be implemented in FRONTEND-05 (#103)."
      />
    </PageContainer>
  );
};
export default ClaimsPage;
