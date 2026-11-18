import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  History,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  usePendingHandovers,
  ConfirmHandoverModal,
  HandoverHistoryModal,
  type FoundItemResponse,
} from '@/features/officer';

export const OfficerHandoversPage: React.FC = () => {
  const {
    items,
    overdueItems,
    overdueCount,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    confirmHandover,
    refetch,
  } = usePendingHandovers();

  const [selectedItemForConfirm, setSelectedItemForConfirm] = useState<FoundItemResponse | null>(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<FoundItemResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE'>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const displayedItems = activeTab === 'OVERDUE' ? overdueItems : items;

  const handleConfirmSuccess = async (id: string, request?: { officerNotes?: string }) => {
    const updated = await confirmHandover(id, request);
    setSuccessMessage(`Physical receipt confirmed for "${updated.title}". Item is now AVAILABLE in student browse and finder reputation points have been awarded.`);
    setTimeout(() => setSuccessMessage(null), 8000);
  };

  const isOverdue = (createdAt: string) => {
    const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pending Handover Verification
            </h1>
            <Badge variant="warning">Custody Safe</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Verify finders physically presenting found items at the Central Security Office safe before catalog publishing.
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

      {/* Success Notification */}
      {successMessage && (
        <Alert variant="success" title="Handover Confirmed" className="mb-6" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" title="Queue Error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Overdue Warning Alert */}
      {overdueCount > 0 && (
        <Alert variant="warning" title="Pending Handovers Overdue (>24h)" className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>
              There {overdueCount === 1 ? 'is' : 'are'} <strong>{overdueCount} item(s)</strong> reported over 24 hours ago still awaiting physical handover. Daily system reminders are being dispatched.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('OVERDUE')}
              className="bg-white text-xs"
            >
              View Overdue ({overdueCount})
            </Button>
          </div>
        </Alert>
      )}

      {/* Tab Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'ALL'
              ? 'bg-campus-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Pending ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('OVERDUE')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'OVERDUE'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Overdue &gt;24h ({overdueCount})
        </button>
      </div>

      {/* Content Section */}
      {isLoading && items.length === 0 ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading pending handover reports..." />
        </div>
      ) : displayedItems.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />}
          title={activeTab === 'OVERDUE' ? 'No Overdue Handovers' : 'Handover Queue Clear'}
          description={
            activeTab === 'OVERDUE'
              ? 'No pending handovers exceed the 24-hour threshold.'
              : 'All reported found items have been physically verified or no new reports have been submitted.'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {displayedItems.map((item) => {
              const overdue = isOverdue(item.createdAt);

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-slate-900 text-base">
                        {item.title}
                      </span>
                      <Badge variant="warning">PENDING_HANDOVER</Badge>
                      <Badge variant="outline">{item.categoryName}</Badge>
                      {overdue && (
                        <Badge variant="danger" size="sm" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue &gt;24h
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <div>
                        <span className="font-medium text-slate-700">Discovered at: </span>
                        <span>{item.locationName}</span>
                        {item.specificLocation && <span> ({item.specificLocation})</span>}
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Reported date: </span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      {item.finderName && (
                        <div>
                          <span className="font-medium text-slate-700">Finder: </span>
                          <span>{item.finderName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItemForHistory(item)}
                      leftIcon={<History className="h-3.5 w-3.5" />}
                    >
                      Audit
                    </Button>
                    <Link to={`/officer/handovers/${item.id}`}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Inspect
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedItemForConfirm(item)}
                      leftIcon={<ShieldCheck className="h-4 w-4" />}
                    >
                      Confirm Physical Receipt
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {activeTab === 'ALL' && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages}
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

      {/* Confirmation Modal */}
      <ConfirmHandoverModal
        isOpen={Boolean(selectedItemForConfirm)}
        onClose={() => setSelectedItemForConfirm(null)}
        item={selectedItemForConfirm}
        onConfirm={handleConfirmSuccess}
      />

      {/* Handover History Modal */}
      <HandoverHistoryModal
        isOpen={Boolean(selectedItemForHistory)}
        onClose={() => setSelectedItemForHistory(null)}
        itemId={selectedItemForHistory?.id || null}
        itemTitle={selectedItemForHistory?.title}
      />
    </PageContainer>
  );
};

export default OfficerHandoversPage;
