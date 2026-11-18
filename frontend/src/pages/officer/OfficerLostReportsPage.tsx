import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  Search,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  History,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useOfficerLostReports,
  ResolveLostReportOfficerModal,
  CancelLostReportOfficerModal,
  LostReportAuditModal,
  type LostReportResponse,
  type LostReportStatus,
} from '@/features/officer';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useLocations } from '@/features/locations/hooks/useLocations';

export const OfficerLostReportsPage: React.FC = () => {
  const {
    reports,
    pageData,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    categoryId,
    setCategoryId,
    locationId,
    setLocationId,
    page,
    totalPages,
    setPage,
    resolveReport,
    cancelReport,
    refetch,
  } = useOfficerLostReports();

  const { categories } = useCategories();
  const { locations } = useLocations();

  const [searchInput, setSearchInput] = useState(query);
  const [selectedForResolve, setSelectedForResolve] = useState<LostReportResponse | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<LostReportResponse | null>(null);
  const [selectedForAudit, setSelectedForAudit] = useState<LostReportResponse | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  const getStatusBadge = (status: LostReportStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="warning">ACTIVE</Badge>;
      case 'RECOVERED':
        return <Badge variant="success">RECOVERED</Badge>;
      case 'RESOLVED':
        return <Badge variant="info">RESOLVED</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Private Lost Reports Desk
            </h1>
            <Badge variant="warning">Private Records</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Confidential student lost item reports submitted within the Central Security Office scope.
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
            Refresh
          </Button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <Alert variant="warning" title="Strict Confidentiality Directive" className="mb-6">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Lost reports are private student records. They are never exposed to other students or included in public catalog browsing. Only authorized Security Officers investigate and manage these filings.
          </span>
        </div>
      </Alert>

      {actionSuccessMessage && (
        <Alert
          variant="success"
          title="Action Completed"
          className="mb-6"
          onClose={() => setActionSuccessMessage(null)}
        >
          {actionSuccessMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Lost Reports Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search lost reports by title or description..."
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Search
            </Button>
            {query && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchInput('');
                  setQuery('');
                }}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            {/* Status Filter */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | LostReportStatus)
                }
                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE (Under Investigation)</option>
                <option value="RECOVERED">RECOVERED (Collected)</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Category</label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || undefined)}
                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Location</label>
              <select
                value={locationId || ''}
                onChange={(e) => setLocationId(e.target.value || undefined)}
                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading && reports.length === 0 ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading private lost reports..." />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileQuestion className="h-8 w-8 text-slate-400" />}
          title="No Lost Reports Found"
          description="No lost reports match your active search filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-slate-900 text-base">
                      {report.title}
                    </span>
                    {getStatusBadge(report.status)}
                    <Badge variant="outline">{report.category.name}</Badge>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <div>
                      <span className="font-medium text-slate-700">Lost At: </span>
                      <span>{report.location.name}</span>
                      {report.specificLocation && <span> ({report.specificLocation})</span>}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Date Lost: </span>
                      <span>{new Date(report.lostAt).toLocaleDateString()}</span>
                    </div>
                    {report.studentContact && (
                      <div>
                        <span className="font-medium text-slate-700">Reporting Student: </span>
                        <span>
                          {report.studentContact.fullName} ({report.studentContact.email})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForAudit(report)}
                    leftIcon={<History className="h-3.5 w-3.5" />}
                  >
                    Audit
                  </Button>

                  {report.status === 'ACTIVE' && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedForResolve(report)}
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      >
                        Resolve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedForCancel(report)}
                        leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-600" />}
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  <Link to={`/officer/lost-reports/${report.id}`}>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pageData && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} ({pageData.totalElements} total filings)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolve Modal */}
      <ResolveLostReportOfficerModal
        isOpen={Boolean(selectedForResolve)}
        onClose={() => setSelectedForResolve(null)}
        report={selectedForResolve}
        onConfirm={async (id, request) => {
          await resolveReport(id, request);
          setActionSuccessMessage(`Lost report "${selectedForResolve?.title}" marked as RESOLVED.`);
        }}
      />

      {/* Cancel Modal */}
      <CancelLostReportOfficerModal
        isOpen={Boolean(selectedForCancel)}
        onClose={() => setSelectedForCancel(null)}
        report={selectedForCancel}
        onConfirm={async (id, request) => {
          await cancelReport(id, request);
          setActionSuccessMessage(`Lost report "${selectedForCancel?.title}" has been CANCELLED.`);
        }}
      />

      {/* Audit Modal */}
      <LostReportAuditModal
        isOpen={Boolean(selectedForAudit)}
        onClose={() => setSelectedForAudit(null)}
        reportId={selectedForAudit?.id || null}
        reportTitle={selectedForAudit?.title}
      />
    </PageContainer>
  );
};

export default OfficerLostReportsPage;
