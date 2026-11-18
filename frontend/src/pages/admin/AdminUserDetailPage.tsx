import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Mail,
  Shield,
  FileBadge,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  useAdminUser,
  UpdateUserStatusModal,
  UpdateUserRoleModal,
} from '@/features/admin';
import { formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/routes/paths';

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const { data: user, isLoading, isError, error } = useAdminUser(userId);

  return (
    <PageContainer>
      {/* Back button */}
      <div className="mb-4">
        <Link
          to={ROUTES.ADMIN.USERS}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to User Governance
        </Link>
      </div>

      {isError && (
        <Alert variant="danger" title="User Not Found" className="mb-6">
          {error || 'Could not load administrative details for this account.'}
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{user.fullName}</h1>
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'danger' : user.role === 'SECURITY_OFFICER' ? 'info' : 'default'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'danger' : 'warning'}>
                    {user.status}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span>•</span>
                  <span>Registered: {formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  Change Status
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRoleModalOpen(true)}
                >
                  <ShieldAlert className="mr-1.5 h-4 w-4" />
                  Change Role
                </Button>
              </div>
            </div>
          </div>

          {/* Account Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-campus-600" />
                  Account Security & Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Account ID</span>
                  <span className="font-mono text-xs text-slate-700">{user.id}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">University Email</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-medium text-slate-900">
                      {user.email}
                    </span>
                    {user.emailVerified ? (
                      <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                        <AlertCircle className="h-3 w-3 mr-0.5" /> Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Student Index Number</span>
                  <span className="font-mono text-xs font-medium text-slate-900">
                    {user.indexNumber || 'Not configured'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Contact Phone</span>
                  <span className="text-xs font-mono text-slate-700">
                    {user.phoneNumber || 'Not provided'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Last Profile Update</span>
                  <span className="text-xs text-slate-700">{formatDate(user.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {user.role === 'SECURITY_OFFICER' ? (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Security Officer Desk Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Officer Badge Number</span>
                    <span className="font-mono text-xs font-semibold text-blue-700">
                      {user.badgeNumber || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Assigned Office</span>
                    <span className="font-medium text-xs text-slate-900">
                      {user.securityOfficeName || 'Central Security Office'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Operational Desk Role</span>
                    <span className="text-xs text-slate-700">
                      Authorized for item receipt, claims review, and collections.
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileBadge className="h-4 w-4 text-slate-500" />
                    Role Privileges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-slate-600">
                  {user.role === 'SUPER_ADMIN' ? (
                    <p>
                      Super Administrator accounts maintain full administrative governance over
                      user accounts, security officer appointments, category taxonomies, campus
                      locations, reputation calibration, and the centralized immutable audit trail.
                    </p>
                  ) : (
                    <p>
                      Student user accounts have standard reporting access to submit found item
                      reports, maintain private lost reports, submit ownership claims with
                      verification proof, and earn reputation points upon verified item collection.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Modals */}
          <UpdateUserStatusModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            user={user}
          />

          <UpdateUserRoleModal
            isOpen={isRoleModalOpen}
            onClose={() => setIsRoleModalOpen(false)}
            user={user}
          />
        </div>
      ) : null}
    </PageContainer>
  );
};

export default AdminUserDetailPage;
