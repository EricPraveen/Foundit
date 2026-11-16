import React from 'react';
import { Layers, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export const OfficerDashboardPage: React.FC = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security Officer Operational Console</h1>
        <p className="mt-1 text-sm text-slate-500">
          Central Security Office &bull; Inventory, Handover Verification & Ownership Reviews
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Pending Handovers</CardTitle>
            <CardDescription>Items reported by finders awaiting physical custody check</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Integrated in FRONTEND-06 (#104).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-campus-100 text-campus-800 mb-2">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Claim Review Queue</CardTitle>
            <CardDescription>Evaluate Student IDs and ownership proof</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Integrated in FRONTEND-06 (#104).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Current Custody Inventory</CardTitle>
            <CardDescription>Full inventory held in the Central Security Office safe</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Integrated in FRONTEND-06 (#104).</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
export default OfficerDashboardPage;
