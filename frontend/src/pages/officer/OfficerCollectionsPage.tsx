import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  usePendingCollections,
  ConfirmCollectionModal,
  type ClaimResponse,
  type CollectionConfirmationResponse,
} from '@/features/officer';

export const OfficerCollectionsPage: React.FC = () => {
  const {
    claims,
    pageData,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    confirmCollection,
    refetch,
  } = usePendingCollections();

  const [selectedForCollection, setSelectedForCollection] = useState<ClaimResponse | null>(null);
  const [collectionResult, setCollectionResult] = useState<CollectionConfirmationResponse | null>(null);

  const handleCollectionSuccess = (response: CollectionConfirmationResponse) => {
    setCollectionResult(response);
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pending Physical Collections
            </h1>
            <Badge variant="info">Collection Desk</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Claims approved after evidence verification; claimants scheduled for physical item handover at the Central Security Office.
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

      {/* Critical Business Rule Banner */}
      <Alert variant="info" title="Central Office Collection Protocol" className="mb-6">
        Claim approval reserves the item (<strong>CLAIM_PENDING</strong>). The item becomes <strong>RETURNED</strong> and the claim <strong>COMPLETED</strong> only after the Security Officer physically confirms handover and inspects the student's physical University Student ID card.
      </Alert>

      {/* Success Notification */}
      {collectionResult && (
        <Alert
          variant="success"
          title="Physical Collection Confirmed"
          className="mb-6"
          onClose={() => setCollectionResult(null)}
        >
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-emerald-950">
              Item successfully marked RETURNED and handed over to {collectionResult.claimantName}!
            </p>
            <p className="text-emerald-800">
              Claim completed &bull; Confirming officer: {collectionResult.confirmingOfficerName} &bull; Reputation awarded: +{collectionResult.pointsAwarded} points
            </p>
          </div>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Queue Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* List */}
      {isLoading && claims.length === 0 ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading pending collection queue..." />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={<PackageCheck className="h-8 w-8 text-emerald-600" />}
          title="No Pending Collections"
          description="All approved claims have been collected or no claims are currently pending physical collection."
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
                    <Badge variant="info">APPROVED (Awaiting Pickup)</Badge>
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
                    {claim.reviewedAt && (
                      <div>
                        <span className="font-medium text-slate-700">Approved date: </span>
                        <span>{new Date(claim.reviewedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {claim.reviewingOfficerName && (
                      <div>
                        <span className="font-medium text-slate-700">Approved by: </span>
                        <span>{claim.reviewingOfficerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/officer/collections/${claim.id}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Review
                    </Button>
                  </Link>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedForCollection(claim)}
                    leftIcon={<PackageCheck className="h-4 w-4" />}
                  >
                    Confirm Collection Handover
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pageData && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} ({pageData.totalElements} pending collections)
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

      {/* Confirm Collection Modal */}
      <ConfirmCollectionModal
        isOpen={Boolean(selectedForCollection)}
        onClose={() => setSelectedForCollection(null)}
        claim={selectedForCollection}
        onConfirm={confirmCollection}
        onSuccess={handleCollectionSuccess}
      />
    </PageContainer>
  );
};

export default OfficerCollectionsPage;
