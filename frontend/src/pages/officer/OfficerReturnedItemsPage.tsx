import React, { useState } from 'react';
import {
  Archive,
  PackageCheck,
  History,
  RefreshCw,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useReturnedItems,
  CollectionDetailsModal,
  HandoverHistoryModal,
  type FoundItemResponse,
} from '@/features/officer';

export const OfficerReturnedItemsPage: React.FC = () => {
  const {
    items,
    pageData,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    refetch,
  } = useReturnedItems();

  const [selectedForReceipt, setSelectedForReceipt] = useState<FoundItemResponse | null>(null);
  const [selectedForHistory, setSelectedForHistory] = useState<FoundItemResponse | null>(null);

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Returned Items & Collection History
            </h1>
            <Badge variant="success">Completed Lifecycle</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Historical log of items physically handed over to verified claimants with recorded collection receipts and reputation awards.
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

      {error && (
        <Alert variant="danger" title="Error Loading Returned Items" className="mb-6">
          {error}
        </Alert>
      )}

      {/* List */}
      {isLoading && items.length === 0 ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading returned items history..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-8 w-8 text-slate-400" />}
          title="No Returned Items Yet"
          description="Items whose physical collection has been confirmed by officers will appear in this historical register."
        />
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-slate-900 text-base">
                      {item.title}
                    </span>
                    <Badge variant="success">RETURNED</Badge>
                    <Badge variant="outline">{item.categoryName}</Badge>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <div>
                      <span className="font-medium text-slate-700">Location: </span>
                      <span>{item.locationName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Returned Date: </span>
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {item.finderName && (
                      <div>
                        <span className="font-medium text-slate-700">Reported By: </span>
                        <span>{item.finderName}</span>
                      </div>
                    )}
                    {item.receivingOfficerName && (
                      <div>
                        <span className="font-medium text-slate-700">Receiving Officer: </span>
                        <span>{item.receivingOfficerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForHistory(item)}
                    leftIcon={<History className="h-3.5 w-3.5" />}
                  >
                    Custody Log
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedForReceipt(item)}
                    leftIcon={<PackageCheck className="h-4 w-4" />}
                  >
                    Collection Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pageData && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages} ({pageData.totalElements} total returned items)
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

      {/* Collection Receipt Modal */}
      <CollectionDetailsModal
        isOpen={Boolean(selectedForReceipt)}
        onClose={() => setSelectedForReceipt(null)}
        foundItemId={selectedForReceipt?.id}
        title={selectedForReceipt ? `Collection Receipt: ${selectedForReceipt.title}` : undefined}
      />

      {/* Handover History Modal */}
      <HandoverHistoryModal
        isOpen={Boolean(selectedForHistory)}
        onClose={() => setSelectedForHistory(null)}
        itemId={selectedForHistory?.id || null}
        itemTitle={selectedForHistory?.title}
      />
    </PageContainer>
  );
};

export default OfficerReturnedItemsPage;
