import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const OfficerHandoversPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Handover Queue & Overdue Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">
          Verify finders bringing physical items to the office and award category reputation points.
        </p>
      </div>
      <EmptyState
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Physical Handover Verification Queue"
        description="Handover confirmation, overdue pending handover checks (>24h), and finder reputation awards in FRONTEND-06 (#104)."
      />
    </PageContainer>
  );
};
export default OfficerHandoversPage;
