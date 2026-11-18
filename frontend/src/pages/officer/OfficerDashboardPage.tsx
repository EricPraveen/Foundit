import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ClipboardCheck,
  PackageCheck,
  Layers,
  FileQuestion,
  Archive,
  RefreshCw,
  AlertTriangle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useOfficerDashboard } from '@/features/officer';
import { ROUTES } from '@/routes/paths';

export const OfficerDashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useOfficerDashboard();

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Security Officer Operational Console
            </h1>
            <Badge variant="default">Officer Portal</Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>
              {data?.officeName || 'Central Security Office'} &bull; Custody Safe, Review Desk & Collection
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="danger" title="Operational Data Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading security office operational metrics..." />
        </div>
      )}

      {/* Metrics Grid */}
      {data && (
        <div className="space-y-6">
          {/* Action-Required Highlights Banner */}
          {(data.pendingHandovers > 0 || data.pendingClaims > 0 || data.pendingCollection > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-950">
                      Triage Queue Action Required
                    </h3>
                    <p className="text-xs text-amber-800">
                      {data.pendingHandovers} handover(s) to verify &bull; {data.pendingClaims} claim(s) under review &bull; {data.pendingCollection} item(s) awaiting collection
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data.pendingHandovers > 0 && (
                    <Link to={ROUTES.OFFICER.HANDOVERS}>
                      <Button size="sm" variant="outline" className="bg-white">
                        Review Handovers
                      </Button>
                    </Link>
                  )}
                  {data.pendingClaims > 0 && (
                    <Link to={ROUTES.OFFICER.CLAIMS}>
                      <Button size="sm" variant="primary">
                        Review Claims
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Available Items */}
            <Card hoverable className="border-emerald-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Available in Catalog</CardDescription>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-extrabold text-emerald-950">
                  {data.availableItems}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Verified items physically in safe and visible in public student browse.
                </p>
              </CardContent>
            </Card>

            {/* Pending Handovers */}
            <Card hoverable className="border-amber-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Pending Handovers</CardDescription>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-extrabold text-amber-950">
                  {data.pendingHandovers}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Student reports awaiting physical receipt confirmation at office.
                </p>
              </CardContent>
            </Card>

            {/* Pending Claims */}
            <Card hoverable className="border-sky-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Pending Claims</CardDescription>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-extrabold text-sky-950">
                  {data.pendingClaims}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Ownership claims awaiting Student ID and evidence evaluation.
                </p>
              </CardContent>
            </Card>

            {/* Pending Collections */}
            <Card hoverable className="border-purple-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Pending Collections</CardDescription>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                    <PackageCheck className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-extrabold text-purple-950">
                  {data.pendingCollection}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Approved claims awaiting physical claimant handover at office.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Returned Items</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                    <Archive className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {data.returnedItems}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Items physically reunited with verified claimants.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Active Lost Reports</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                    <FileQuestion className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {data.activeLostReports}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Private lost reports registered within designated office scope.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>Unclaimed Custody Items</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {data.unclaimedItems}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-500">
                  Past threshold without confirmed claims; stored per university policy.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Navigation Panels */}
          <div className="pt-4">
            <h2 className="text-base font-semibold text-slate-900 mb-3">
              Officer Operations Modules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to={ROUTES.OFFICER.HANDOVERS} className="block group">
                <Card hoverable className="h-full group-hover:border-campus-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-campus-900 transition-colors" />
                    </div>
                    <CardTitle className="text-base mt-2">Physical Handover Verification</CardTitle>
                    <CardDescription>
                      Review items reported by finders and confirm physical receipt into custody.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={ROUTES.OFFICER.CLAIMS} className="block group">
                <Card hoverable className="h-full group-hover:border-campus-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-campus-900 transition-colors" />
                    </div>
                    <CardTitle className="text-base mt-2">Ownership Claims Review</CardTitle>
                    <CardDescription>
                      Inspect student ID cards and ownership proof; approve or reject claims.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={ROUTES.OFFICER.COLLECTIONS} className="block group">
                <Card hoverable className="h-full group-hover:border-campus-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                        <PackageCheck className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-campus-900 transition-colors" />
                    </div>
                    <CardTitle className="text-base mt-2">Pending Physical Collections</CardTitle>
                    <CardDescription>
                      Verify claimant identity in person and record item collection from safe.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={ROUTES.OFFICER.LOST_REPORTS} className="block group">
                <Card hoverable className="h-full group-hover:border-campus-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
                        <FileQuestion className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-campus-900 transition-colors" />
                    </div>
                    <CardTitle className="text-base mt-2">Private Lost Reports</CardTitle>
                    <CardDescription>
                      Search student lost item reports; assist inquiries, resolve, or cancel.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={ROUTES.OFFICER.FOUND_ITEMS} className="block group">
                <Card hoverable className="h-full group-hover:border-campus-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                        <Layers className="h-5 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-campus-900 transition-colors" />
                    </div>
                    <CardTitle className="text-base mt-2">Custody Inventory</CardTitle>
                    <CardDescription>
                      Filter and manage all found items by availability and handover status.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to={ROUTES.OFFICER.RETURNED_ITEMS} className="block group">
                <Card hoverable className="h-full group-hover:border-campus-400 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                        <Archive className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-campus-900 transition-colors" />
                    </div>
                    <CardTitle className="text-base mt-2">Returned Items History</CardTitle>
                    <CardDescription>
                      Review complete collection audit logs and verified return receipts.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default OfficerDashboardPage;
