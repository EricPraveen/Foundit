import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const OfficerClaimsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Officer Claims Review</h1>
        <p className="mt-1 text-sm text-slate-500">
          Verify sensitive claimant evidence, approve rightful owners, or reject invalid claims.
        </p>
      </div>
      <EmptyState
        icon={<ClipboardCheck className="h-6 w-6" />}
        title="Claims Review Desk"
        description="Private evidence inspection, single-approval concurrency, and collection confirmation in FRONTEND-06 (#104)."
      />
    </PageContainer>
  );
};
export default OfficerClaimsPage;
