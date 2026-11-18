import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  useAdminAuditLogs,
  AuditLogDetailModal,
} from '@/features/admin';
import type { AuditLogResponse, AuditLogFilterParams } from '@/features/admin';
import { formatDate } from '@/lib/utils/formatters';

export const AdminAuditLogsPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilterParams>({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
  });

  const [actionInput, setActionInput] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedLogForDetail, setSelectedLogForDetail] =
    useState<AuditLogResponse | null>(null);

  const { data: pageData, isLoading, isError, error, isFetching } =
    useAdminAuditLogs(filters);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      action: actionInput.trim() || undefined,
      outcome: selectedOutcome || undefined,
      entityType: selectedEntityType.trim() || undefined,
      page: 0,
    }));
  };

  const handleResetFilters = () => {
    setActionInput('');
    setSelectedOutcome('');
    setSelectedEntityType('');
    setFilters({ page: 0, size: 20, sort: 'createdAt,desc' });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-indigo-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Audit Trail
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Immutable append-only system records tracking security, governance, and operational events.
          </p>
        </div>
      </div>

      <Alert variant="info" title="Centralized Compliance Audit Trail" className="mb-6">
        Audit records are append-only and cannot be altered or deleted. Sensitive credentials,
        passwords, and confidential ownership proofs are strictly excluded from audit payloads.
      </Alert>

      {/* Filter Toolbar */}
      <div className="mb-6 rounded-lg bg-white p-4 border border-slate-200 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Action Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="e.g. USER_STATUS_UPDATED, ITEM_HANDOVER..."
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Entity Type
              </label>
              <Input
                type="text"
                placeholder="e.g. USER, FOUND_ITEM, CLAIM..."
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Outcome
              </label>
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
              >
                <option value="">All Outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {(filters.action || filters.outcome || filters.entityType) && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" disabled={isFetching}>
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Apply Filters
            </Button>
          </div>
        </form>
      </div>

      {isError && (
        <Alert variant="danger" title="Error Loading Audit Trail" className="mb-6">
          {error || 'Failed to retrieve audit log records.'}
        </Alert>
      )}

      {/* Audit Logs Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Action</th>
                <th scope="col" className="px-4 py-3 text-left">Actor</th>
                <th scope="col" className="px-4 py-3 text-left">Target Entity</th>
                <th scope="col" className="px-4 py-3 text-left">Outcome</th>
                <th scope="col" className="px-4 py-3 text-left">Timestamp</th>
                <th scope="col" className="px-4 py-3 text-right">Details</th>
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
                pageData.content.map((log: AuditLogResponse) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-slate-800">
                        {log.actorEmail || 'System'}
                      </div>
                      {log.actorRole && (
                        <div className="font-mono text-[10px] text-slate-400">
                          {log.actorRole}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                      <span className="font-medium">{log.entityType}</span>
                      {log.entityId && (
                        <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={log.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                        {log.outcome}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLogForDetail(log)}
                        title="View Record Details"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <XCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No audit records found matching filter criteria.
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
              <span className="font-semibold">{pageData.totalPages}</span> ({pageData.totalElements} records)
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

      {/* Detail Modal */}
      <AuditLogDetailModal
        isOpen={!!selectedLogForDetail}
        onClose={() => setSelectedLogForDetail(null)}
        log={selectedLogForDetail}
      />
    </PageContainer>
  );
};

export default AdminAuditLogsPage;
