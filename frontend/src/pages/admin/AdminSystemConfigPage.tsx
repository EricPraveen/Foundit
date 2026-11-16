import React from 'react';
import { Settings } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const AdminSystemConfigPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Configuration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inspect central office configuration, holding periods, and storage settings.
        </p>
      </div>
      <EmptyState
        icon={<Settings className="h-6 w-6" />}
        title="System Configuration Inspector"
        description="Inspect backend environment settings, storage provider, and notification rules in FRONTEND-07 (#105)."
      />
    </PageContainer>
  );
};
export default AdminSystemConfigPage;
