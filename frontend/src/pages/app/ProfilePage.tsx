import React from 'react';
import { User, Award } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <PageContainer size="sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Profile & Reputation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account details and view verified reputation point history.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-campus-100 text-campus-800">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{user?.fullName || 'Student User'}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">Assigned Role:</span>
              <Badge variant="info">{user?.role || 'STUDENT'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Reputation Points</CardTitle>
                <CardDescription>Points awarded for verified handovers and resolved items</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Reputation transaction ledger inspection will be connected in FRONTEND-03/05.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
export default ProfilePage;
