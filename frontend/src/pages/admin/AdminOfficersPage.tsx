import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Clock,
  MapPin,
  Edit,
  Eye,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  useAdminOfficers,
  useCentralOffice,
  ProvisionOfficerModal,
  UpdateOfficeModal,
  UpdateUserStatusModal,
} from '@/features/admin';
import type { OfficerProfileResponse, AdminUserResponse } from '@/features/admin';

export const AdminOfficersPage: React.FC = () => {
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] =
    useState<AdminUserResponse | null>(null);

  const {
    data: officers,
    isLoading: isLoadingOfficers,
    isError: isOfficersError,
    error: officersError,
  } = useAdminOfficers();

  const {
    data: office,
    isLoading: isLoadingOffice,
    isError: isOfficeError,
  } = useCentralOffice();

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Security Officer Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Provision verified Security Officers for the Central Security Office and manage official desk contact parameters.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsProvisionModalOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Provision New Officer
        </Button>
      </div>

      {/* Central Security Office Overview */}
      <div className="mb-8">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-700" />
              <CardTitle className="text-base text-blue-950">
                Central Security Office
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOfficeModalOpen(true)}
              className="border-blue-200 text-blue-900 hover:bg-blue-100/50"
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Configure Office
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingOffice ? (
              <div className="h-16 bg-blue-100/40 animate-pulse rounded" />
            ) : isOfficeError ? (
              <Alert variant="warning" title="Office Details Unavailable">
                Central Security Office details could not be retrieved.
              </Alert>
            ) : office ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">{office.campusLocation}</p>
                </div>

                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Contact Email
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {office.contactEmail || 'Not configured'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Contact Phone
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {office.contactPhone || 'Not configured'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Operating Hours
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {office.operatingHours || '24/7 Desk'}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {isOfficersError && (
        <Alert variant="danger" title="Error Loading Officers" className="mb-6">
          {officersError || 'Failed to retrieve security officers list.'}
        </Alert>
      )}

      {/* Officers Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Provisioned Security Officers ({officers?.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Officer Name</th>
                <th scope="col" className="px-4 py-3 text-left">Email</th>
                <th scope="col" className="px-4 py-3 text-left">Badge #</th>
                <th scope="col" className="px-4 py-3 text-left">Office</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingOfficers ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : officers && officers.length > 0 ? (
                officers.map((officer: OfficerProfileResponse) => (
                  <tr key={officer.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {officer.fullName}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {officer.email}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                      {officer.badgeNumber || 'Unassigned'}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-700">
                      {officer.officeName || 'Central Security Office'}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={
                          officer.status === 'ACTIVE'
                            ? 'success'
                            : officer.status === 'SUSPENDED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {officer.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                      <Link to={`/admin/users/${officer.userId}`}>
                        <Button variant="ghost" size="sm" title="Inspect Full Account">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Change Account Status"
                        onClick={() =>
                          setSelectedUserForStatus({
                            id: officer.userId,
                            email: officer.email,
                            fullName: officer.fullName,
                            role: officer.role,
                            status: officer.status,
                            emailVerified: true,
                            indexNumber: null,
                            phoneNumber: null,
                            indexNumberVerified: false,
                            badgeNumber: officer.badgeNumber,
                            securityOfficeId: null,
                            securityOfficeName: officer.officeName,
                            createdAt: '',
                            updatedAt: '',
                          })
                        }
                      >
                        <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No Security Officers provisioned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProvisionOfficerModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
      />

      <UpdateOfficeModal
        isOpen={isOfficeModalOpen}
        onClose={() => setIsOfficeModalOpen(false)}
        office={office || null}
      />

      <UpdateUserStatusModal
        isOpen={!!selectedUserForStatus}
        onClose={() => setSelectedUserForStatus(null)}
        user={selectedUserForStatus}
      />
    </PageContainer>
  );
};

export default AdminOfficersPage;
