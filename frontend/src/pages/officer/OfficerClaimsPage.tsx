import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  RefreshCw,
  PackageCheck,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useOfficerClaims,
  ApproveClaimModal,
  RejectClaimModal,
  type ClaimResponse,
  type ClaimStatus,
} from '@/features/officer';

export const OfficerClaimsPage: React.FC = () => {
  const {
    claims,
    pageData,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    page,
    totalPages,
    setPage,
    approveClaim,
    rejectClaim,
    refetch,
  } = useOfficerClaims();

  const [selectedForApprove, setSelectedForApprove] = useState<ClaimResponse | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<ClaimResponse | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">UNDER REVIEW</Badge>;
      case 'APPROVED':
        return <Badge variant="info">APPROVED (Awaiting Collection)</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED (Collected)</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
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
              Ownership Claims Review Desk
            </h1>
            <Badge variant="warning">Sensitive Evidence</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Examine Student IDs and ownership proof submitted by claimants; make binding ownership decisions.
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
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert variant="warning" title="Sensitive Evidence Authorization" className="mb-6">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Claim review involves confidential university records (University Student ID cards and Index Numbers). Access is restricted exclusively to authorized Security Officers. Never store or disclose this evidence.
          </span>
        </div>
      </Alert>

      {actionSuccessMessage && (
        <Alert
          variant="success"
          title="Decision Recorded"
          className="mb-6"
          onClose={() => setActionSuccessMessage(null)}
        >
          {actionSuccessMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Claims Queue Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
        {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-campus-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'ALL'
                ? 'All Claims'
                : status === 'PENDING'
                ? 'Pending Review'
                : status === 'APPROVED'
                ? 'Approved (Pending Collection)'
                : status === 'COMPLETED'
                ? 'Collected'
                : 'Rejected'}
            </button>
          );
        })}
      </div>

      {/* Claims List */}
      {isLoading && claims.length === 0 ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading claims queue..." />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8 text-slate-400" />}
          title="No Claims Found"
          description="No ownership claims match the selected status filter."
        />
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-slate-900 text-base">
                      {claim.foundItemTitle}
                    </span>
                    {getStatusBadge(claim.status)}
                    <span className="text-xs text-slate-400 font-mono">
                      Claim #{claim.id.substring(0, 8)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2">
                    {claim.ownershipDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <div>
                      <span className="font-medium text-slate-700">Claimant: </span>
                      <span className="font-semibold text-slate-800">{claim.claimant.fullName}</span>
                      <span className="text-slate-500"> ({claim.claimant.email})</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Index Number: </span>
                      <span className="font-mono font-medium text-slate-900">{claim.claimant.indexNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Submitted: </span>
                      <span>{new Date(claim.submittedAt).toLocaleString()}</span>
                    </div>
                    {claim.evidence && (
                      <div>
                        <span className="font-medium text-slate-700">Evidence files: </span>
                        <span>{claim.evidence.length} file(s) attached</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {claim.status === 'PENDING' && (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedForApprove(claim)}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setSelectedForReject(claim)}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {claim.status === 'APPROVED' && (
                    <Link to={`/officer/collections/${claim.id}`}>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={<PackageCheck className="h-4 w-4" />}
                      >
                        Proceed to Collection
                      </Button>
                    </Link>
                  )}

                  <Link to={`/officer/claims/${claim.id}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Review Evidence
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
                Page {page + 1} of {totalPages} ({pageData.totalElements} total claims)
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

      {/* Approve Modal */}
      <ApproveClaimModal
        isOpen={Boolean(selectedForApprove)}
        onClose={() => setSelectedForApprove(null)}
        claim={selectedForApprove}
        onConfirm={async (claimId, request) => {
          await approveClaim(claimId, request);
          setActionSuccessMessage(`Claim for "${selectedForApprove?.foundItemTitle}" approved. Item marked CLAIM_PENDING and ready for physical collection.`);
        }}
      />

      {/* Reject Modal */}
      <RejectClaimModal
        isOpen={Boolean(selectedForReject)}
        onClose={() => setSelectedForReject(null)}
        claim={selectedForReject}
        onConfirm={async (claimId, request) => {
          await rejectClaim(claimId, request);
          setActionSuccessMessage(`Claim for "${selectedForReject?.foundItemTitle}" has been rejected.`);
        }}
      />
    </PageContainer>
  );
};

export default OfficerClaimsPage;
