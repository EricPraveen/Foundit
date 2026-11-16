import React from 'react';
import { Bell } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export const NotificationsPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          In-app alerts for handovers, claim status changes, and collection reminders.
        </p>
      </div>
      <EmptyState
        icon={<Bell className="h-6 w-6" />}
        title="Notifications Center"
        description="Real-time notification feeds, mark-as-read actions, and handover alerts will be implemented in FRONTEND-05/06."
      />
    </PageContainer>
  );
};
export default NotificationsPage;
