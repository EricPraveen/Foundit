import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type { FoundItemResponse, ConfirmHandoverRequest } from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UsePendingHandoversResult {
  pageData: Page<FoundItemResponse> | null;
  items: FoundItemResponse[];
  overdueItems: FoundItemResponse[];
  overdueCount: number;
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  setPage: (page: number) => void;
  confirmHandover: (id: string, request?: ConfirmHandoverRequest) => Promise<FoundItemResponse>;
  refetch: () => Promise<void>;
}

export function usePendingHandovers(initialPage = 0, size = 20): UsePendingHandoversResult {
  const [page, setPage] = useState<number>(initialPage);
  const [pageData, setPageData] = useState<Page<FoundItemResponse> | null>(null);
  const [overdueItems, setOverdueItems] = useState<FoundItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchHandovers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pendingData, overdueData] = await Promise.all([
        officerService.getPendingHandovers(page, size),
        officerService.getOverdueHandovers(24).catch(() => [] as FoundItemResponse[]),
      ]);
      setPageData(pendingData);
      setOverdueItems(overdueData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load pending handovers.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchHandovers();
  }, [fetchHandovers]);

  const confirmHandover = async (
    id: string,
    request?: ConfirmHandoverRequest
  ): Promise<FoundItemResponse> => {
    setActionLoadingId(id);
    try {
      const updated = await officerService.confirmHandover(id, request);
      await fetchHandovers();
      return updated;
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    pageData,
    items: pageData?.content || [],
    overdueItems,
    overdueCount: overdueItems.length,
    isLoading,
    error,
    actionLoadingId,
    page,
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    setPage,
    confirmHandover,
    refetch: fetchHandovers,
  };
}
