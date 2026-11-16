import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageSearch,
  FileQuestion,
  ClipboardCheck,
  Award,
  PlusCircle,
  Search,
  User,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  MapPin,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useStudentDashboard } from '@/features/dashboard';
import { CategoriesList } from '@/features/categories';
import { LocationsList } from '@/features/locations';
import { Card, CardContent } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/paths';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    stats,
    recentActivity,
    isLoading,
    errors,
    hasErrors,
    refetchAll,
    refetchSection,
  } = useStudentDashboard();

  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'claims' | 'reputation'>('all');
  const [showReferenceDirectory, setShowReferenceDirectory] = useState<'none' | 'categories' | 'locations'>('none');

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const renderFoundStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success" size="sm">Available at Counter</Badge>;
      case 'PENDING_HANDOVER':
        return <Badge variant="warning" size="sm">Handover Pending</Badge>;
      case 'CLAIM_PENDING':
        return <Badge variant="info" size="sm">Claim Pending</Badge>;
      case 'RETURNED':
        return <Badge variant="default" size="sm">Returned to Owner</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const renderLostStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="warning" size="sm">Searching (Active)</Badge>;
      case 'RESOLVED':
      case 'RECOVERED':
        return <Badge variant="success" size="sm">Recovered</Badge>;
      case 'CANCELLED':
        return <Badge variant="default" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const renderClaimStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'APPROVED':
        return <Badge variant="success" size="sm">Approved for Pickup</Badge>;
      case 'COMPLETED':
        return <Badge variant="info" size="sm">Collected</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="default" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      {/* 1. Welcome Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user?.fullName || 'Student'}
            </h1>
            <Badge variant="info" size="sm" className="hidden sm:inline-flex">
              Student
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            University of Moratuwa Lost & Found Portal &bull; Central Security Office Custody
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAll()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Global partial errors alert if any section failed */}
      {hasErrors && (
        <Alert variant="warning" title="Some dashboard data could not be refreshed" className="mb-6">
          <div className="text-xs space-y-1">
            {errors.reputation && <p>&bull; Reputation: {errors.reputation}</p>}
            {errors.foundReports && <p>&bull; Found Reports: {errors.foundReports}</p>}
            {errors.lostReports && <p>&bull; Lost Reports: {errors.lostReports}</p>}
            {errors.claims && <p>&bull; Claims: {errors.claims}</p>}
          </div>
        </Alert>
      )}

      {/* 2. Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Reputation Points */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reputation Points
                </p>
                {isLoading && stats.reputationBalance === null ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : errors.reputation ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Unavailable</span>
                    <button
                      onClick={() => refetchSection('reputation')}
                      className="text-campus-700 underline ml-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.reputationBalance ?? 0}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({stats.reputationTotalEarned ?? 0} earned)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-xs">
                <Award className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Verified student standing</span>
              <Link to={ROUTES.APP.PROFILE} className="text-campus-700 hover:text-campus-900 font-medium inline-flex items-center">
                History &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* My Found Reports */}
        <Card className="border-l-4 border-l-campus-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  My Found Reports
                </p>
                {isLoading && stats.foundReportsCount === null ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : errors.foundReports ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Unavailable</span>
                    <button
                      onClick={() => refetchSection('foundReports')}
                      className="text-campus-700 underline ml-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.foundReportsCount ?? 0}
                    </span>
                    <span className="text-xs text-slate-500">submitted</span>
                  </div>
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-campus-50 text-campus-700 shadow-xs">
                <PackageSearch className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Awaiting / completed custody</span>
              <Link to={ROUTES.APP.FOUND_ITEMS} className="text-campus-700 hover:text-campus-900 font-medium inline-flex items-center">
                Browse &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* My Lost Reports */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  My Lost Reports
                </p>
                {isLoading && stats.lostReportsCount === null ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : errors.lostReports ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Unavailable</span>
                    <button
                      onClick={() => refetchSection('lostReports')}
                      className="text-campus-700 underline ml-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.lostReportsCount ?? 0}
                    </span>
                    <span className="text-xs text-slate-500">filed</span>
                  </div>
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-xs">
                <FileQuestion className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Private officer-inspected</span>
              <Link to={ROUTES.APP.LOST_REPORTS} className="text-campus-700 hover:text-campus-900 font-medium inline-flex items-center">
                Reports &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* My Ownership Claims */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  My Claims
                </p>
                {isLoading && stats.claimsCount === null ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : errors.claims ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Unavailable</span>
                    <button
                      onClick={() => refetchSection('claims')}
                      className="text-campus-700 underline ml-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.claimsCount ?? 0}
                    </span>
                    <span className="text-xs text-slate-500">claims</span>
                  </div>
                )}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-xs">
                <ClipboardCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
              <span>Evidence-backed ownership</span>
              <Link to={ROUTES.APP.CLAIMS} className="text-campus-700 hover:text-campus-900 font-medium inline-flex items-center">
                Review &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quick Actions Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to={ROUTES.APP.FOUND_ITEMS}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-campus-400 hover:shadow-xs transition-all text-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-campus-100 text-campus-800 shrink-0">
              <Search className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold block truncate">Browse Found</span>
              <span className="text-xs text-slate-500 block truncate">Inspect verified items</span>
            </div>
          </Link>

          <Link
            to={ROUTES.APP.LOST_REPORTS}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-campus-400 hover:shadow-xs transition-all text-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-800 shrink-0">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold block truncate">Report Lost Item</span>
              <span className="text-xs text-slate-500 block truncate">Private report</span>
            </div>
          </Link>

          <Link
            to={ROUTES.APP.FOUND_ITEMS}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-campus-400 hover:shadow-xs transition-all text-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
              <PackageSearch className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold block truncate">Report Found Item</span>
              <span className="text-xs text-slate-500 block truncate">Hand over to officer</span>
            </div>
          </Link>

          <Link
            to={ROUTES.APP.CLAIMS}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-campus-400 hover:shadow-xs transition-all text-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-800 shrink-0">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold block truncate">My Claims</span>
              <span className="text-xs text-slate-500 block truncate">Check pickup status</span>
            </div>
          </Link>

          <Link
            to={ROUTES.APP.PROFILE}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-campus-400 hover:shadow-xs transition-all text-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold block truncate">Profile & Points</span>
              <span className="text-xs text-slate-500 block truncate">Manage details</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Recent Activity Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Student Activity</h2>
            <p className="text-xs text-slate-500">
              Your recent reports, claims, and verified reputation awards
            </p>
          </div>

          {/* Activity Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'lost', 'found', 'claims', 'reputation'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all' && 'All'}
                {tab === 'lost' && 'Lost'}
                {tab === 'found' && 'Found'}
                {tab === 'claims' && 'Claims'}
                {tab === 'reputation' && 'Points'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state for activity */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Render Activity Items */}
        {!isLoading && (
          <div className="space-y-3">
            {/* 1. Lost Reports */}
            {(activeTab === 'all' || activeTab === 'lost') &&
              recentActivity.recentLostReports.map((report) => (
                <Card key={report.id} hoverable>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <FileQuestion className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{report.title}</span>
                          <Badge variant="default" size="sm" className="text-[10px]">Lost Report</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>Category: <strong className="text-slate-700">{report.category?.name || 'General'}</strong></span>
                          <span>&bull;</span>
                          <span>Location: <strong className="text-slate-700">{report.location?.name || 'Campus'}</strong></span>
                          <span>&bull;</span>
                          <span>Lost: {formatDate(report.lostAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {renderLostStatusBadge(report.status)}
                      <Link
                        to={ROUTES.APP.LOST_REPORTS}
                        className="text-xs font-medium text-campus-700 hover:text-campus-900"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* 2. Found Reports */}
            {(activeTab === 'all' || activeTab === 'found') &&
              recentActivity.recentFoundReports.map((item) => (
                <Card key={item.id} hoverable>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-campus-100 text-campus-800 shrink-0 mt-0.5">
                        <PackageSearch className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{item.title}</span>
                          <Badge variant="default" size="sm" className="text-[10px]">Found Report</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>Category: <strong className="text-slate-700">{item.category?.name || 'General'}</strong></span>
                          <span>&bull;</span>
                          <span>Location: <strong className="text-slate-700">{item.location?.name || 'Campus'}</strong></span>
                          <span>&bull;</span>
                          <span>Reported: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {renderFoundStatusBadge(item.status)}
                      <Link
                        to={ROUTES.APP.FOUND_ITEMS}
                        className="text-xs font-medium text-campus-700 hover:text-campus-900"
                      >
                        Details &rarr;
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* 3. Claims */}
            {(activeTab === 'all' || activeTab === 'claims') &&
              recentActivity.recentClaims.map((claim) => (
                <Card key={claim.id} hoverable>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            Claim for: {claim.foundItemTitle || 'Found Item'}
                          </span>
                          <Badge variant="default" size="sm" className="text-[10px]">Claim</Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Submitted on {formatDate(claim.submittedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {renderClaimStatusBadge(claim.status)}
                      <Link
                        to={ROUTES.APP.CLAIMS}
                        className="text-xs font-medium text-campus-700 hover:text-campus-900"
                      >
                        Status &rarr;
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* 4. Reputation Transactions */}
            {(activeTab === 'all' || activeTab === 'reputation') &&
              recentActivity.recentReputationTransactions.map((tx) => (
                <Card key={tx.id} hoverable>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{tx.description}</span>
                          <Badge variant="warning" size="sm" className="text-[10px]">
                            {tx.transactionType === 'FOUND_ITEM_HANDOVER'
                              ? 'Handover Reward'
                              : tx.transactionType === 'ITEM_COLLECTION'
                              ? 'Collection Reward'
                              : 'Adjustment'}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Awarded on {formatDate(tx.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        +{tx.points} pts
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Empty state when active tab has no records */}
            {((activeTab === 'all' &&
              recentActivity.recentLostReports.length === 0 &&
              recentActivity.recentFoundReports.length === 0 &&
              recentActivity.recentClaims.length === 0 &&
              recentActivity.recentReputationTransactions.length === 0) ||
              (activeTab === 'lost' && recentActivity.recentLostReports.length === 0) ||
              (activeTab === 'found' && recentActivity.recentFoundReports.length === 0) ||
              (activeTab === 'claims' && recentActivity.recentClaims.length === 0) ||
              (activeTab === 'reputation' &&
                recentActivity.recentReputationTransactions.length === 0)) && (
              <EmptyState
                icon={<Clock className="h-10 w-10 text-slate-400" />}
                title="No Recent Activity"
                description={
                  activeTab === 'lost'
                    ? "You haven't filed any lost reports yet."
                    : activeTab === 'found'
                    ? "You haven't submitted any found item reports yet."
                    : activeTab === 'claims'
                    ? "You haven't submitted any ownership claims yet."
                    : activeTab === 'reputation'
                    ? 'No reputation points have been earned yet.'
                    : 'You have no recent lost reports, found items, or claims on CampusFind.'
                }
              />
            )}
          </div>
        )}
      </div>

      {/* 5. Reference Data Directory Section (Categories & Campus Locations) */}
      <div className="mt-10 border-t border-slate-200 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Campus Reference Directory</h2>
            <p className="text-xs text-slate-500">
              Explore official categories and custody locations used across lost and found reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showReferenceDirectory === 'categories' ? 'primary' : 'outline'}
              size="sm"
              onClick={() =>
                setShowReferenceDirectory((prev) => (prev === 'categories' ? 'none' : 'categories'))
              }
              className="flex items-center gap-1.5 text-xs"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{showReferenceDirectory === 'categories' ? 'Hide Categories' : 'Browse Categories'}</span>
            </Button>
            <Button
              variant={showReferenceDirectory === 'locations' ? 'primary' : 'outline'}
              size="sm"
              onClick={() =>
                setShowReferenceDirectory((prev) => (prev === 'locations' ? 'none' : 'locations'))
              }
              className="flex items-center gap-1.5 text-xs"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{showReferenceDirectory === 'locations' ? 'Hide Locations' : 'Browse Locations'}</span>
            </Button>
          </div>
        </div>

        {showReferenceDirectory === 'categories' && (
          <div className="mb-6">
            <CategoriesList />
          </div>
        )}

        {showReferenceDirectory === 'locations' && (
          <div className="mb-6">
            <LocationsList />
          </div>
        )}

        {showReferenceDirectory === 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:border-campus-300 hover:shadow-xs transition-all"
              onClick={() => setShowReferenceDirectory('categories')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-campus-100 text-campus-800">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Lost & Found Categories</h3>
                    <p className="text-xs text-slate-500">View official taxonomies verified for university items</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all"
              onClick={() => setShowReferenceDirectory('locations')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Campus Locations & Zones</h3>
                    <p className="text-xs text-slate-500">View University of Moratuwa buildings and custody zones</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
