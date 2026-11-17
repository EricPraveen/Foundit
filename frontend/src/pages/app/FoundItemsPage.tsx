import React, { useState } from 'react';
import {
  PackageSearch,
  PlusCircle,
  FileText,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useAvailableFoundItems,
  useMyFoundReports,
  useSecurityOffice,
  HandoverGuidanceNotice,
  FoundItemFilters,
  FoundItemCard,
  MyFoundReportCard,
  ReportFoundItemModal,
  EditFoundItemModal,
  FoundItemDetailModal,
  type FoundItemResponse,
  type StatusTab,
} from '@/features/found-items';

export const FoundItemsPage: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'catalog' | 'my-reports' | 'guidance'>('catalog');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<FoundItemResponse | null>(null);
  const [selectedDetailItemId, setSelectedDetailItemId] = useState<string | null>(null);

  // Available Items (Catalog Browser)
  const {
    items: catalogItems,
    pageData: catalogPageData,
    filters: catalogFilters,
    isLoading: catalogLoading,
    error: catalogError,
    updateFilter,
    resetFilters,
    setPage: setCatalogPage,
    refetch: refetchCatalog,
  } = useAvailableFoundItems();

  // Student's Own Found Reports
  const {
    filteredReports,
    activeStatusTab,
    setActiveStatusTab,
    statusCounts,
    isLoading: reportsLoading,
    error: reportsError,
    actionLoadingId,
    cancelReport,
    updateReport,
    uploadImage,
    deleteImage,
    refetch: refetchReports,
  } = useMyFoundReports();

  // Central Security Office
  const { office } = useSecurityOffice();

  const handleRefresh = async () => {
    if (activeMainTab === 'catalog') {
      await refetchCatalog();
    } else {
      await refetchReports();
    }
  };

  const handleReportCreated = () => {
    refetchReports();
    refetchCatalog();
  };

  return (
    <PageContainer>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Found Items & Custody
            </h1>
            <Badge variant="default" size="sm">
              Official Registry
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Browse verified items held at the Central Security Office or report items you found on campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            aria-label="Refresh items"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Report Found Item
          </Button>
        </div>
      </div>

      {/* Handover Guidance Compact Notice */}
      <div className="mb-6">
        <HandoverGuidanceNotice office={office} compact />
      </div>

      {/* Main Tabs Header */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveMainTab('catalog')}
            className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors border-b-2 ${
              activeMainTab === 'catalog'
                ? 'border-campus-900 text-campus-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackageSearch className="h-4 w-4" />
            <span>Available Items Catalog</span>
            {catalogPageData?.totalElements !== undefined && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {catalogPageData.totalElements}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('my-reports')}
            className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors border-b-2 ${
              activeMainTab === 'my-reports'
                ? 'border-campus-900 text-campus-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>My Found Reports</span>
            {statusCounts.PENDING > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {statusCounts.PENDING} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('guidance')}
            className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors border-b-2 ${
              activeMainTab === 'guidance'
                ? 'border-campus-900 text-campus-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Handover Policy</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: AVAILABLE ITEMS CATALOG */}
      {activeMainTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <FoundItemFilters
            filters={catalogFilters}
            onUpdateFilter={updateFilter}
            onResetFilters={resetFilters}
          />

          {/* Catalog Grid / States */}
          {catalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <Alert variant="danger">
              <div className="flex items-center justify-between">
                <span>{catalogError}</span>
                <Button variant="outline" size="sm" onClick={() => refetchCatalog()}>
                  Retry
                </Button>
              </div>
            </Alert>
          ) : catalogItems.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-10 w-10 text-slate-400" />}
              title="No Available Items Found"
              description="No physically verified items currently match your search filters. Try clearing your filters or check back after officers verify new arrivals."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear Search Filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {catalogItems.map((item) => (
                  <FoundItemCard
                    key={item.id}
                    item={item}
                    onViewDetails={(id) => setSelectedDetailItemId(id)}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {catalogPageData && catalogPageData.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">
                    Showing{' '}
                    <span className="font-medium text-slate-900">
                      {catalogPageData.number * catalogPageData.size + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-slate-900">
                      {Math.min(
                        (catalogPageData.number + 1) * catalogPageData.size,
                        catalogPageData.totalElements
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-slate-900">{catalogPageData.totalElements}</span>{' '}
                    items
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCatalogPage(Math.max(0, catalogPageData.number - 1))}
                      disabled={catalogPageData.first}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-medium text-slate-700 px-2">
                      Page {catalogPageData.number + 1} of {catalogPageData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCatalogPage(
                          Math.min(catalogPageData.totalPages - 1, catalogPageData.number + 1)
                        )
                      }
                      disabled={catalogPageData.last}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: MY FOUND REPORTS */}
      {activeMainTab === 'my-reports' && (
        <div className="space-y-6">
          {/* Status Tabs Sub-bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(
              [
                { id: 'ALL', label: 'All Reports', count: statusCounts.ALL },
                { id: 'PENDING', label: 'Pending Handover', count: statusCounts.PENDING },
                { id: 'CONFIRMED', label: 'Verified & Handed Over', count: statusCounts.CONFIRMED },
                { id: 'CANCELLED', label: 'Cancelled', count: statusCounts.CANCELLED },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id as StatusTab)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeStatusTab === tab.id
                    ? 'bg-campus-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeStatusTab === tab.id ? 'bg-campus-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Reports List */}
          {reportsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ))}
            </div>
          ) : reportsError ? (
            <Alert variant="danger">
              <div className="flex items-center justify-between">
                <span>{reportsError}</span>
                <Button variant="outline" size="sm" onClick={() => refetchReports()}>
                  Retry
                </Button>
              </div>
            </Alert>
          ) : filteredReports.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-10 w-10 text-slate-400" />}
              title="No Found Reports in This Category"
              description={
                activeStatusTab === 'PENDING'
                  ? 'You have no pending items awaiting handover at the Central Security Office.'
                  : activeStatusTab === 'ALL'
                  ? 'You have not reported any found items yet. If you pick up lost property on campus, report it here and deliver it to the Security Office to earn reputation.'
                  : `You have no ${activeStatusTab.toLowerCase()} reports.`
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Report a Found Item
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <MyFoundReportCard
                  key={report.id}
                  report={report}
                  onEdit={(rep) => setEditingReport(rep)}
                  onCancel={async (id) => {
                    await cancelReport(id);
                  }}
                  onUploadImage={async (id, file) => {
                    await uploadImage(id, file);
                  }}
                  onDeleteImage={async (id, imgId) => {
                    await deleteImage(id, imgId);
                  }}
                  onViewDetails={(id) => setSelectedDetailItemId(id)}
                  isActionLoading={actionLoadingId === report.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HANDOVER POLICY */}
      {activeMainTab === 'guidance' && (
        <div className="max-w-4xl space-y-6">
          <HandoverGuidanceNotice office={office} />
        </div>
      )}

      {/* Modals */}
      <ReportFoundItemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleReportCreated}
      />

      <EditFoundItemModal
        isOpen={Boolean(editingReport)}
        onClose={() => setEditingReport(null)}
        item={editingReport}
        onSave={async (id, req) => {
          return await updateReport(id, req);
        }}
      />

      <FoundItemDetailModal
        itemId={selectedDetailItemId}
        isOpen={Boolean(selectedDetailItemId)}
        onClose={() => setSelectedDetailItemId(null)}
        onEditItem={() => {
          const found = filteredReports.find((r) => r.id === selectedDetailItemId);
          if (found) {
            setSelectedDetailItemId(null);
            setEditingReport(found);
          }
        }}
      />
    </PageContainer>
  );
};

export default FoundItemsPage;
