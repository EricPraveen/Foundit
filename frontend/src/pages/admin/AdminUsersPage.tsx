import React from 'react';
import { Users } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const AdminUsersPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Governance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Super Admin management of student accounts, officer provisioning, and role changes.
        </p>
      </div>
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="User Governance Management"
        description="Filter users by role/status, assign officer desks, and update user status in FRONTEND-07 (#105)."
      />
    </PageContainer>
  );
};
export default AdminUsersPage;
