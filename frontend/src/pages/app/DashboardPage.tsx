import React from 'react';
import { PackageSearch, FileQuestion, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {user?.fullName || 'Student'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          CampusFind Student Overview &bull; University of Moratuwa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-campus-100 text-campus-800 mb-2">
              <PackageSearch className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Found Items Catalog</CardTitle>
            <CardDescription>Browse verified items held at the Security Office</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Module will be integrated in FRONTEND-03 (#101).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <FileQuestion className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Private Lost Reports</CardTitle>
            <CardDescription>Track reports visible only to you and Security Officers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Module will be integrated in FRONTEND-04 (#102).</p>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 mb-2">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">My Ownership Claims</CardTitle>
            <CardDescription>Review submission status and collection instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Module will be integrated in FRONTEND-05 (#103).</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
export default DashboardPage;
