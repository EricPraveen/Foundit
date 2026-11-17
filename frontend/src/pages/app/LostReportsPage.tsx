import React, { useState } from 'react';
import { Plus, Lock, FileQuestion } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Alert } from '@/components/ui/Alert';
import {
  useMyLostReports,
  LostReportCard,
  CreateLostReportModal,
  EditLostReportModal,
  ResolveLostReportModal,
  CancelLostReportModal,
  LostReportDetailModal,
  type LostReportResponse,
  type LostReportStatusFilter,
} from '@/features/lost-reports';

export const LostReportsPage: React.FC = () => {
  const {
    filteredReports,
    statusFilter,
    setStatusFilter,
    statusCounts,
    isLoading,
    error,
    refetch,
    page,
    totalPages,
    setPage,
  } = useMyLostReports();

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LostReportResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const filterTabs: { label: string; value: LostReportStatusFilter; count: number }[] = [
    { label: 'All Reports', value: 'ALL', count: statusCounts.ALL },
    { label: 'Active Search', value: 'ACTIVE', count: statusCounts.ACTIVE },
    { label: 'Resolved', value: 'RESOLVED', count: statusCounts.RESOLVED },
    { label: 'Recovered', value: 'RECOVERED', count: statusCounts.RECOVERED },
    { label: 'Cancelled', value: 'CANCELLED', count: statusCounts.CANCELLED },
  ];

  const handleView = (report: LostReportResponse) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const handleEdit = (report: LostReportResponse) => {
    setSelectedReport(report);
    setIsEditOpen(true);
  };

  const handleResolve = (report: LostReportResponse) => {
    setSelectedReport(report);
    setIsResolveOpen(true);
  };

  const handleCancel = (report: LostReportResponse) => {
    setSelectedReport(report);
    setIsCancelOpen(true);
  };

  return (
    <PageContainer>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Lost Reports
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-campus-50 border border-campus-200 px-2.5 py-0.5 text-xs font-medium text-campus-700">
              <Lock className="h-3 w-3" />
              Private Records
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your private lost item reports. Visible only to you and authorized Security Officers.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Report Lost Item
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-semibold transition-all border-b-2 -mb-[1px] ${
                isActive
                  ? 'border-campus-700 text-campus-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? 'bg-campus-100 text-campus-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingIndicator size="md" message="Loading your lost reports..." />
        </div>
      ) : error ? (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <p className="text-xs">{error || 'Failed to load lost reports.'}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={<FileQuestion className="h-8 w-8 text-slate-400" />}
          title={statusFilter === 'ALL' ? 'No lost reports submitted yet' : `No ${statusFilter.toLowerCase()} reports found`}
          description={
            statusFilter === 'ALL'
              ? 'If you have lost an item on campus, submit a report so Security Officers can cross-reference it when found items are handed over.'
              : `You have no lost reports with "${statusFilter}" status.`
          }
          action={
            statusFilter === 'ALL' ? (
              <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Submit Your First Report
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report: LostReportResponse) => (
              <LostReportCard
                key={report.id}
                report={report}
                onView={handleView}
                onEdit={handleEdit}
                onResolve={handleResolve}
                onCancel={handleCancel}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-600">
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateLostReportModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditLostReportModal
        report={selectedReport}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          refetch();
        }}
      />

      <ResolveLostReportModal
        report={selectedReport}
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        onSuccess={() => {
          setIsResolveOpen(false);
          refetch();
        }}
      />

      <CancelLostReportModal
        report={selectedReport}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={() => {
          setIsCancelOpen(false);
          refetch();
        }}
      />

      <LostReportDetailModal
        report={selectedReport}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(rep) => {
          setSelectedReport(rep);
          setIsEditOpen(true);
        }}
        onResolve={(rep) => {
          setSelectedReport(rep);
          setIsResolveOpen(true);
        }}
        onCancel={(rep) => {
          setSelectedReport(rep);
          setIsCancelOpen(true);
        }}
      />
    </PageContainer>
  );
};

export default LostReportsPage;
