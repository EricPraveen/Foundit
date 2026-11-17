import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type {
  FoundItemResponse,
  OfficerFoundItemFilterParams,
  ItemAvailabilityStatus,
  HandoverStatus,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseOfficerFoundItemsResult {
  items: FoundItemResponse[];
  pageData: Page<FoundItemResponse> | null;
  isLoading: boolean;
  error: string | null;
  filters: OfficerFoundItemFilterParams;
  setAvailabilityStatus: (status?: ItemAvailabilityStatus) => void;
  setHandoverStatus: (status?: HandoverStatus) => void;
  setCategoryId: (id?: string) => void;
  setLocationId: (id?: string) => void;
  setQuery: (q?: string) => void;
  setPage: (p: number) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
}

export function useOfficerFoundItems(
  initialFilters: OfficerFoundItemFilterParams = {}
): UseOfficerFoundItemsResult {
  const [filters, setFilters] = useState<OfficerFoundItemFilterParams>({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
    ...initialFilters,
  });

  const [pageData, setPageData] = useState<Page<FoundItemResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await officerService.listFoundItems(filters);
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load officer found items.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const setAvailabilityStatus = (status?: ItemAvailabilityStatus) => {
    setFilters((prev) => ({ ...prev, availabilityStatus: status, page: 0 }));
  };

  const setHandoverStatus = (status?: HandoverStatus) => {
    setFilters((prev) => ({ ...prev, handoverStatus: status, page: 0 }));
  };

  const setCategoryId = (categoryId?: string) => {
    setFilters((prev) => ({ ...prev, categoryId: categoryId || undefined, page: 0 }));
  };

  const setLocationId = (locationId?: string) => {
    setFilters((prev) => ({ ...prev, locationId: locationId || undefined, page: 0 }));
  };

  const setQuery = (query?: string) => {
    setFilters((prev) => ({ ...prev, query: query || undefined, page: 0 }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const resetFilters = () => {
    setFilters({
      page: 0,
      size: 20,
      sort: 'createdAt,desc',
    });
  };

  return {
    items: pageData?.content || [],
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
    refetch: fetchItems,
  };
}
