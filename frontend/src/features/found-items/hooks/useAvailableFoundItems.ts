import { useState, useEffect, useCallback } from 'react';
import { foundItemService } from '../services/foundItemService';
import type { FoundItemFilterParams, FoundItemSummaryResponse } from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAvailableFoundItemsResult {
  items: FoundItemSummaryResponse[];
  pageData: Page<FoundItemSummaryResponse> | null;
  filters: FoundItemFilterParams;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: FoundItemFilterParams) => void;
  updateFilter: <K extends keyof FoundItemFilterParams>(key: K, value: FoundItemFilterParams[K]) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

const DEFAULT_FILTERS: FoundItemFilterParams = {
  query: '',
  categoryId: undefined,
  locationId: undefined,
  fromDate: undefined,
  toDate: undefined,
  page: 0,
  size: 12,
  sort: 'foundAt,desc',
};

export function useAvailableFoundItems(
  initialFilters: Partial<FoundItemFilterParams> = {}
): UseAvailableFoundItemsResult {
  const [filters, setFiltersState] = useState<FoundItemFilterParams>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const [pageData, setPageData] = useState<Page<FoundItemSummaryResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await foundItemService.getAvailableFoundItems(filters);
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load available found items.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const setFilters = useCallback((newFilters: FoundItemFilterParams) => {
    setFiltersState({
      ...newFilters,
      page: newFilters.page ?? 0,
      size: newFilters.size ?? DEFAULT_FILTERS.size,
      sort: newFilters.sort ?? DEFAULT_FILTERS.sort,
    });
  }, []);

  const updateFilter = useCallback(
    <K extends keyof FoundItemFilterParams>(key: K, value: FoundItemFilterParams[K]) => {
      setFiltersState((prev) => ({
        ...prev,
        [key]: value,
        // Reset to page 0 on any filter change other than page itself
        ...(key !== 'page' ? { page: 0 } : {}),
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const setPage = useCallback((newPage: number) => {
    setFiltersState((prev) => ({ ...prev, page: newPage }));
  }, []);

  return {
    items: pageData?.content || [],
    pageData,
    filters,
    isLoading,
    error,
    setFilters,
    updateFilter,
    resetFilters,
    setPage,
    refetch: fetchItems,
  };
}
