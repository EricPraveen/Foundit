import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type {
  FoundItemResponse,
  CollectionConfirmationResponse,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseReturnedItemsResult {
  items: FoundItemResponse[];
  pageData: Page<FoundItemResponse> | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  setPage: (p: number) => void;
  getCollectionDetails: (id: string) => Promise<CollectionConfirmationResponse>;
  refetch: () => Promise<void>;
}

export function useReturnedItems(initialPage = 0, size = 20): UseReturnedItemsResult {
  const [page, setPage] = useState<number>(initialPage);
  const [pageData, setPageData] = useState<Page<FoundItemResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await officerService.listFoundItems({
        availabilityStatus: 'RETURNED',
        page,
        size,
        sort: 'updatedAt,desc',
      });
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load returned items.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getCollectionDetails = async (id: string): Promise<CollectionConfirmationResponse> => {
    return officerService.getCollectionByFoundItemId(id);
  };

  return {
    items: pageData?.content || [],
    pageData,
    isLoading,
    error,
    page,
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    setPage,
    getCollectionDetails,
    refetch: fetchItems,
  };
}
