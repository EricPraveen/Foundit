import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  useAdminUsers,
  UpdateUserStatusModal,
  UpdateUserRoleModal,
} from '@/features/admin';
import type { AdminUserResponse, AdminUserFilterParams } from '@/features/admin';
import type { UserRole, UserStatus } from '@/types/auth';
import { formatDate } from '@/lib/utils/formatters';
import { ROUTES } from '@/routes/paths';

export const AdminUsersPage: React.FC = () => {
  const [filters, setFilters] = useState<AdminUserFilterParams>({
    page: 0,
    size: 15,
    sort: 'createdAt,desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const [selectedUserForStatus, setSelectedUserForStatus] =
    useState<AdminUserResponse | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] =
    useState<AdminUserResponse | null>(null);

  const { data: pageData, isLoading, isError, error, isFetching } = useAdminUsers(filters);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      query: searchInput.trim() || undefined,
      page: 0,
    }));
  };

  const handleRoleFilterChange = (role: string) => {
    setFilters((prev) => ({
      ...prev,
      role: role ? (role as UserRole) : undefined,
      page: 0,
    }));
  };

  const handleStatusFilterChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status ? (status as UserStatus) : undefined,
      page: 0,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'danger';
      case 'SECURITY_OFFICER':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-campus-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Governance
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Inspect platform accounts, enforce university security policies, manage account status, and govern roles.
          </p>
        </div>

        <Link to={ROUTES.ADMIN.OFFICERS}>
          <Button variant="outline" size="sm">
            <Shield className="mr-2 h-4 w-4" />
            Security Officers Desk
          </Button>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-6 rounded-lg bg-white p-4 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, university email, or index number..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="primary" disabled={isFetching}>
            Search
          </Button>
          {(filters.query || filters.role || filters.status) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchInput('');
                setFilters({ page: 0, size: 15, sort: 'createdAt,desc' });
              }}
            >
              Reset Filters
            </Button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase text-slate-500">Role:</span>
            <select
              value={filters.role || ''}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-campus-600"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">STUDENT</option>
              <option value="SECURITY_OFFICER">SECURITY_OFFICER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Status:</span>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-campus-600"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      {isError && (
        <Alert variant="danger" title="Error Loading Users" className="mb-6">
          {error || 'Failed to retrieve users list.'}
        </Alert>
      )}

      {/* Users Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">User</th>
                <th scope="col" className="px-4 py-3 text-left">Role</th>
                <th scope="col" className="px-4 py-3 text-left">Status</th>
                <th scope="col" className="px-4 py-3 text-left">Email Verified</th>
                <th scope="col" className="px-4 py-3 text-left">Registered</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : pageData?.content && pageData.content.length > 0 ? (
                pageData.content.map((u: AdminUserResponse) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                      {u.badgeNumber && (
                        <div className="text-[11px] text-blue-600 font-mono mt-0.5">
                          Badge: {u.badgeNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {u.role}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(u.status)}>
                        {u.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                      <Link to={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="sm" title="View Profile">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Change Account Status"
                        onClick={() => setSelectedUserForStatus(u)}
                      >
                        <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Change Role"
                        onClick={() => setSelectedUserForRole(u)}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <XCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No users found matching query and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50 text-xs">
            <span className="text-slate-500">
              Showing page <span className="font-semibold">{pageData.number + 1}</span> of{' '}
              <span className="font-semibold">{pageData.totalPages}</span> ({pageData.totalElements} users)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pageData.number - 1)}
                disabled={pageData.first || isFetching}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pageData.number + 1)}
                disabled={pageData.last || isFetching}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status & Role Modals */}
      <UpdateUserStatusModal
        isOpen={!!selectedUserForStatus}
        onClose={() => setSelectedUserForStatus(null)}
        user={selectedUserForStatus}
      />

      <UpdateUserRoleModal
        isOpen={!!selectedUserForRole}
        onClose={() => setSelectedUserForRole(null)}
        user={selectedUserForRole}
      />
    </PageContainer>
  );
};

export default AdminUsersPage;
