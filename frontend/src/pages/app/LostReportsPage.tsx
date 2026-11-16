import React from 'react';
import { FileQuestion } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const LostReportsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Lost Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Private reports strictly protected under anti-enumeration and visible only to Security Officers.
        </p>
      </div>
      <EmptyState
        icon={<FileQuestion className="h-6 w-6" />}
        title="Lost Reports Workspace"
        description="Private report creation, item details, image uploads, and resolution status will be implemented in FRONTEND-04 (#102)."
      />
    </PageContainer>
  );
};
export default LostReportsPage;
