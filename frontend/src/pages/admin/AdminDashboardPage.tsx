import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Layers,
  MapPin,
  Award,
  ScrollText,
  Settings,
  PackageSearch,
  Clock,
  ClipboardCheck,
  PackageCheck,
  Archive,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAdminDashboard } from '@/features/admin';
import { ROUTES } from '@/routes/paths';

export const AdminDashboardPage: React.FC = () => {
  const { data: metrics, isLoading, isError, error, refetch, isFetching } =
    useAdminDashboard();

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System Administration
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            CampusFind platform governance, security officer provisioning, taxonomies, and audit trail
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      {isError && (
        <Alert variant="danger" title="Failed to Load Operational Statistics" className="mb-6">
          {error ||
            'Unable to fetch administrative aggregates. Please verify connection and administrator privileges.'}
        </Alert>
      )}

      {/* Metrics Section */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : metrics ? (
        <div className="space-y-6 mb-8">
          {/* Identity & Reference Metrics */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Identity & Platform Reference
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-campus-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Users</span>
                    <Users className="h-4 w-4 text-campus-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.totalUsers}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {metrics.activeUsers} active accounts
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Security Officers</span>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.totalOfficers}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Central Security Office</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Categories</span>
                    <Layers className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.totalCategories}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Item taxonomies</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Campus Locations</span>
                    <MapPin className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.totalLocations}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Custody reference</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Active Lost Reports</span>
                    <ClipboardCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.activeLostReports}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Private student logs</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Operational Custody Metrics */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Operational Custody & Inventory
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Available</span>
                    <PackageSearch className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{metrics.availableItems}</p>
                  <p className="text-[10px] text-slate-400">Published in catalog</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Handovers</span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{metrics.pendingHandovers}</p>
                  <p className="text-[10px] text-slate-400">Awaiting officer</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Claims Review</span>
                    <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{metrics.pendingClaims}</p>
                  <p className="text-[10px] text-slate-400">Pending review</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Collections</span>
                    <PackageCheck className="h-4 w-4 text-cyan-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{metrics.pendingCollection}</p>
                  <p className="text-[10px] text-slate-400">Approved for pickup</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Returned</span>
                    <Archive className="h-4 w-4 text-slate-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{metrics.returnedItems}</p>
                  <p className="text-[10px] text-slate-400">Handed back to owner</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Unclaimed</span>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">{metrics.unclaimedItems}</p>
                  <p className="text-[10px] text-slate-400">Escalated items</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      {/* Administration Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hoverable className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-campus-100 text-campus-800 mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">User Governance</CardTitle>
            <CardDescription>
              Inspect all registered accounts, manage account activation/deactivation, and assign roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.USERS}
              className="inline-flex items-center text-sm font-semibold text-campus-700 hover:text-campus-900"
            >
              Manage Users <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-800 mb-2">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Security Officers</CardTitle>
            <CardDescription>
              Provision verified officers for Central Security Office and manage desk contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.OFFICERS}
              className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Manage Officers <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-800 mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Category Management</CardTitle>
            <CardDescription>
              Configure lost and found item taxonomy categories and toggle active status.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.CATEGORIES}
              className="inline-flex items-center text-sm font-semibold text-purple-700 hover:text-purple-900"
            >
              Manage Categories <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-800 mb-2">
              <MapPin className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Campus Locations</CardTitle>
            <CardDescription>
              Maintain verified university zones, building locations, and custody drop points.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.LOCATIONS}
              className="inline-flex items-center text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              Manage Locations <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-2">
              <Award className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Reputation Rules</CardTitle>
            <CardDescription>
              Calibrate points awarded for physical handovers and owner item returns per category.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.REPUTATION_RULES}
              className="inline-flex items-center text-sm font-semibold text-amber-700 hover:text-amber-900"
            >
              Calibrate Rules <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 mb-2">
              <Settings className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Unclaimed Policy & Config</CardTitle>
            <CardDescription>
              Review unclaimed escalation parameters, 24h handover reminder cycles, and storage settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.SYSTEM_CONFIG}
              className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              View System Policies <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="flex flex-col justify-between md:col-span-2 lg:col-span-3 border-indigo-200 bg-indigo-50/20">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 mb-2">
              <ScrollText className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">System Audit Trail</CardTitle>
            <CardDescription>
              Inspect immutable audit records tracking authentication, status changes, handovers, claims, collections, and administrative actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              to={ROUTES.ADMIN.AUDIT_LOGS}
              className="inline-flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Inspect Audit Logs <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AdminDashboardPage;
