import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  History,
  PackageCheck,
  Eye,
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
  useOfficerFoundItems,
  HandoverHistoryModal,
  CollectionDetailsModal,
  type FoundItemResponse,
  type ItemAvailabilityStatus,
  type HandoverStatus,
} from '@/features/officer';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useLocations } from '@/features/locations/hooks/useLocations';

export const OfficerFoundItemsPage: React.FC = () => {
  const {
    items,
    pageData,
    isLoading,
    error,
    filters,
    setAvailabilityStatus,
    setHandoverStatus,
    setCategoryId,
    setLocationId,
    setQuery,
    setPage,
    resetFilters,
    refetch,
  } = useOfficerFoundItems();

  const { categories } = useCategories();
  const { locations } = useLocations();

  const [searchInput, setSearchInput] = useState(filters.query || '');
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<FoundItemResponse | null>(null);
  const [selectedItemForCollection, setSelectedItemForCollection] = useState<FoundItemResponse | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  const getAvailabilityBadge = (status: ItemAvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">AVAILABLE</Badge>;
      case 'CLAIM_PENDING':
        return <Badge variant="warning">CLAIM_PENDING</Badge>;
      case 'RETURNED':
        return <Badge variant="default">RETURNED</Badge>;
      case 'UNCLAIMED':
        return <Badge variant="danger">UNCLAIMED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHandoverBadge = (status: HandoverStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success" size="sm">HANDED OVER</Badge>;
      case 'PENDING':
        return <Badge variant="warning" size="sm">PENDING HANDOVER</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Custody Safe & Found Inventory
            </h1>
            <Badge variant="default">Inventory</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Comprehensive registry of items handed over, cataloged, reserved, and returned at the Central Security Office.
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
        <Alert variant="danger" title="Inventory Error" className="mb-6">
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
                placeholder="Search inventory by title or description..."
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-campus-700 focus:outline-none focus:ring-1 focus:ring-campus-700"
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              Search
            </Button>
            {filters.query && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchInput('');
                  resetFilters();
                }}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
            {/* Availability Status Filter */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Availability Status</label>
              <select
                value={filters.availabilityStatus || ''}
                onChange={(e) =>
                  setAvailabilityStatus(
                    (e.target.value as ItemAvailabilityStatus) || undefined
                  )
                }
                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
              >
                <option value="">All Availabilities</option>
                <option value="AVAILABLE">AVAILABLE (Catalog Live)</option>
                <option value="CLAIM_PENDING">CLAIM_PENDING (Reserved)</option>
                <option value="RETURNED">RETURNED (Collected)</option>
                <option value="UNCLAIMED">UNCLAIMED</option>
                <option value="DISPOSED">DISPOSED</option>
              </select>
            </div>

            {/* Handover Status Filter */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Handover Status</label>
              <select
                value={filters.handoverStatus || ''}
                onChange={(e) =>
                  setHandoverStatus((e.target.value as HandoverStatus) || undefined)
                }
                className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-800"
              >
                <option value="">All Handover States</option>
                <option value="CONFIRMED">CONFIRMED (In Custody)</option>
                <option value="PENDING">PENDING (Not Handed In)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Category</label>
              <select
                value={filters.categoryId || ''}
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

            {/* Location Dropdown */}
            <div>
              <label className="font-medium text-slate-600 block mb-1">Location</label>
              <select
                value={filters.locationId || ''}
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

      {/* Inventory Items List */}
      {isLoading && items.length === 0 ? (
        <div className="py-16 flex justify-center">
          <LoadingIndicator size="lg" message="Loading officer inventory..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8 text-slate-400" />}
          title="No Inventory Matches"
          description="No items match your active filters or search terms."
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
                    {getAvailabilityBadge(item.availabilityStatus)}
                    {getHandoverBadge(item.handoverStatus)}
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
                      <span className="font-medium text-slate-700">Found Date: </span>
                      <span>{new Date(item.foundAt).toLocaleDateString()}</span>
                    </div>
                    {item.finderName && (
                      <div>
                        <span className="font-medium text-slate-700">Finder: </span>
                        <span>{item.finderName}</span>
                      </div>
                    )}
                    {item.receivingOfficerName && (
                      <div>
                        <span className="font-medium text-slate-700">Received By: </span>
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
                    onClick={() => setSelectedItemForHistory(item)}
                    leftIcon={<History className="h-3.5 w-3.5" />}
                  >
                    Custody Log
                  </Button>

                  {item.availabilityStatus === 'RETURNED' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedItemForCollection(item)}
                      leftIcon={<PackageCheck className="h-3.5 w-3.5" />}
                    >
                      Return Receipt
                    </Button>
                  )}

                  <Link to={`/officer/handovers/${item.id}`}>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pageData && pageData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                Page {filters.page! + 1} of {pageData.totalPages} ({pageData.totalElements} total items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(filters.page! - 1)}
                  disabled={filters.page === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(filters.page! + 1)}
                  disabled={filters.page! + 1 >= pageData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custody History Modal */}
      <HandoverHistoryModal
        isOpen={Boolean(selectedItemForHistory)}
        onClose={() => setSelectedItemForHistory(null)}
        itemId={selectedItemForHistory?.id || null}
        itemTitle={selectedItemForHistory?.title}
      />

      {/* Collection Receipt Modal */}
      <CollectionDetailsModal
        isOpen={Boolean(selectedItemForCollection)}
        onClose={() => setSelectedItemForCollection(null)}
        foundItemId={selectedItemForCollection?.id}
        title={selectedItemForCollection ? `Return Receipt for: ${selectedItemForCollection.title}` : undefined}
      />
    </PageContainer>
  );
};

export default OfficerFoundItemsPage;
