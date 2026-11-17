import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Lock, Search } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/routes/paths';
import {
  useMyClaims,
  ClaimCard,
  ClaimDetailModal,
  CancelClaimModal,
  SubmitClaimModal,
  type ClaimSummaryResponse,
  type ClaimResponse,
  type ClaimStatusFilter,
} from '@/features/claims';

export const ClaimsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredClaims,
    statusFilter,
    setStatusFilter,
    statusCounts,
    isLoading,
    error,
    refetch,
    page,
    totalPages,
    setPage,
  } = useMyClaims();

  // Modals
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [claimToCancel, setClaimToCancel] = useState<ClaimSummaryResponse | ClaimResponse | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Resubmission modal state
  const [resubmitTarget, setResubmitTarget] = useState<{
    itemId: string;
    itemTitle: string;
  } | null>(null);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);

  const filterTabs: { label: string; value: ClaimStatusFilter; count: number }[] = [
    { label: 'All Claims', value: 'ALL', count: statusCounts.ALL },
    { label: 'Under Review', value: 'PENDING', count: statusCounts.PENDING },
    { label: 'Approved', value: 'APPROVED', count: statusCounts.APPROVED },
    { label: 'Rejected', value: 'REJECTED', count: statusCounts.REJECTED },
    { label: 'Collected', value: 'COMPLETED', count: statusCounts.COMPLETED },
    { label: 'Cancelled', value: 'CANCELLED', count: statusCounts.CANCELLED },
  ];

  const handleView = (claim: ClaimSummaryResponse) => {
    setSelectedClaimId(claim.id);
    setIsDetailOpen(true);
  };

  const handleCancel = (claim: ClaimSummaryResponse | ClaimResponse) => {
    setClaimToCancel(claim);
    setIsCancelOpen(true);
  };

  const handleResubmit = (claim: ClaimSummaryResponse | ClaimResponse) => {
    setResubmitTarget({
      itemId: claim.foundItemId,
      itemTitle: claim.foundItemTitle,
    });
    setIsResubmitOpen(true);
  };

  return (
    <PageContainer>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Ownership Claims
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-campus-50 border border-campus-200 px-2.5 py-0.5 text-xs font-medium text-campus-700">
              <Lock className="h-3 w-3" />
              Private Evidence
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track ownership claims, verify review decisions by Security Officers, and coordinate physical collection.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.APP.FOUND_ITEMS)}
          className="shrink-0 self-start sm:self-auto"
        >
          <Search className="mr-1.5 h-4 w-4" />
          Browse Found Items
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
          <LoadingIndicator size="md" message="Loading your claims..." />
        </div>
      ) : error ? (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <p className="text-xs">{error || 'Failed to load claims.'}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8 text-slate-400" />}
          title={statusFilter === 'ALL' ? 'No ownership claims submitted' : `No ${statusFilter.toLowerCase()} claims found`}
          description={
            statusFilter === 'ALL'
              ? 'If you find your lost belongings in the available items directory, submit an ownership claim with your Student ID card and purchase evidence.'
              : `You have no claims currently matching "${statusFilter}".`
          }
          action={
            statusFilter === 'ALL' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(ROUTES.APP.FOUND_ITEMS)}
              >
                <Search className="mr-1.5 h-4 w-4" />
                Browse Available Items
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClaims.map((claim: ClaimSummaryResponse) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onView={handleView}
                onCancel={handleCancel}
                onResubmit={handleResubmit}
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
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claim Detail Modal */}
      <ClaimDetailModal
        claimId={selectedClaimId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedClaimId(null);
        }}
        onCancelClaim={(claim) => {
          setIsDetailOpen(false);
          handleCancel(claim);
        }}
        onResubmitClaim={(claim) => {
          setIsDetailOpen(false);
          handleResubmit(claim);
        }}
      />

      {/* Cancel Confirmation Modal */}
      <CancelClaimModal
        claim={claimToCancel}
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setClaimToCancel(null);
        }}
        onSuccess={() => refetch()}
      />

      {/* Resubmit Modal */}
      {resubmitTarget && (
        <SubmitClaimModal
          itemId={resubmitTarget.itemId}
          itemTitle={resubmitTarget.itemTitle}
          isOpen={isResubmitOpen}
          onClose={() => {
            setIsResubmitOpen(false);
            setResubmitTarget(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </PageContainer>
  );
};

export default ClaimsPage;
