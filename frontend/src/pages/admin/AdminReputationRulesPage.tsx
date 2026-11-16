import React from 'react';
import { Award } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const AdminReputationRulesPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reputation Rules Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure category points for verified handovers and resolved collections.
        </p>
      </div>
      <EmptyState
        icon={<Award className="h-6 w-6" />}
        title="Reputation Rules Console"
        description="Inspect and update category reputation reward points in FRONTEND-07 (#105)."
      />
    </PageContainer>
  );
};
export default AdminReputationRulesPage;
