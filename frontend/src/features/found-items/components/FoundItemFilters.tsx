import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { useCategories } from '@/features/categories';
import { useLocations } from '@/features/locations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { FoundItemFilterParams } from '../types';

export interface FoundItemFiltersProps {
  filters: FoundItemFilterParams;
  onUpdateFilter: <K extends keyof FoundItemFilterParams>(key: K, value: FoundItemFilterParams[K]) => void;
  onResetFilters: () => void;
  className?: string;
}

export const FoundItemFilters: React.FC<FoundItemFiltersProps> = ({
  filters,
  onUpdateFilter,
  onResetFilters,
  className = '',
}) => {
  const { categories, isLoading: loadingCategories } = useCategories();
  const { locations, isLoading: loadingLocations } = useLocations();

  const hasActiveFilters = Boolean(
    filters.query ||
      filters.categoryId ||
      filters.locationId ||
      filters.fromDate ||
      filters.toDate ||
      (filters.sort && filters.sort !== 'foundAt,desc')
  );

  return (
    <div className={`space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="flex-1 relative">
          <Input
            id="catalog-search"
            type="text"
            placeholder="Search by item title or description..."
            value={filters.query || ''}
            onChange={(e) => onUpdateFilter('query', e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              filters.query ? (
                <button
                  type="button"
                  onClick={() => onUpdateFilter('query', '')}
                  className="hover:text-slate-600 focus:outline-none"
                  aria-label="Clear search text"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            className="text-slate-600 hover:text-slate-900 self-end sm:self-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter row: Category, Location, Date Range, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Category Select */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.categoryId || ''}
            onChange={(e) => onUpdateFilter('categoryId', e.target.value || undefined)}
            className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
            disabled={loadingCategories}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Location Select */}
        <div>
          <label htmlFor="filter-location" className="block text-xs font-medium text-slate-700 mb-1">
            Campus Location
          </label>
          <select
            id="filter-location"
            value={filters.locationId || ''}
            onChange={(e) => onUpdateFilter('locationId', e.target.value || undefined)}
            className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
            disabled={loadingLocations}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.campusZone ? `(${loc.campusZone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Found Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-from-date" className="block text-xs font-medium text-slate-700 mb-1">
              Found After
            </label>
            <input
              type="date"
              id="filter-from-date"
              value={filters.fromDate ? filters.fromDate.slice(0, 10) : ''}
              onChange={(e) =>
                onUpdateFilter(
                  'fromDate',
                  e.target.value ? new Date(e.target.value).toISOString() : undefined
                )
              }
              className="block w-full rounded-md border border-slate-300 bg-white py-2 px-2 text-xs text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
            />
          </div>
          <div>
            <label htmlFor="filter-to-date" className="block text-xs font-medium text-slate-700 mb-1">
              Found Before
            </label>
            <input
              type="date"
              id="filter-to-date"
              value={filters.toDate ? filters.toDate.slice(0, 10) : ''}
              onChange={(e) => {
                if (!e.target.value) {
                  onUpdateFilter('toDate', undefined);
                  return;
                }
                const date = new Date(e.target.value);
                date.setHours(23, 59, 59, 999);
                onUpdateFilter('toDate', date.toISOString());
              }}
              className="block w-full rounded-md border border-slate-300 bg-white py-2 px-2 text-xs text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
            />
          </div>
        </div>

        {/* Sort Select */}
        <div>
          <label htmlFor="filter-sort" className="block text-xs font-medium text-slate-700 mb-1">
            Sort Order
          </label>
          <select
            id="filter-sort"
            value={filters.sort || 'foundAt,desc'}
            onChange={(e) => onUpdateFilter('sort', e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-campus-600 focus:outline-none focus:ring-1 focus:ring-campus-600"
          >
            <option value="foundAt,desc">Date Found (Newest first)</option>
            <option value="foundAt,asc">Date Found (Oldest first)</option>
            <option value="createdAt,desc">Reported Date (Newest first)</option>
            <option value="title,asc">Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
