import React from 'react';
import { Users, Award, ScrollText, Settings } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export const AdminDashboardPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          CampusFind Governance, Audit Logging & Operational Configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-campus-100 text-campus-800 mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">User Governance</CardTitle>
            <CardDescription>Roles, statuses & officer assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Scheduled for FRONTEND-07 (#105).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <Award className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Reputation Rules</CardTitle>
            <CardDescription>Configure category points</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Scheduled for FRONTEND-07 (#105).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 mb-2">
              <ScrollText className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Audit Trail</CardTitle>
            <CardDescription>Immutable system event logs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Scheduled for FRONTEND-07 (#105).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 mb-2">
              <Settings className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Configuration</CardTitle>
            <CardDescription>System properties & offices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Scheduled for FRONTEND-07 (#105).</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
export default AdminDashboardPage;
