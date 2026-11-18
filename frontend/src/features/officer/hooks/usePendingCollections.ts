import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type {
  ClaimResponse,
  ConfirmCollectionRequest,
  CollectionConfirmationResponse,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UsePendingCollectionsResult {
  claims: ClaimResponse[];
  pageData: Page<ClaimResponse> | null;
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  setPage: (p: number) => void;
  confirmCollection: (
    claimId: string,
    request?: ConfirmCollectionRequest
  ) => Promise<CollectionConfirmationResponse>;
  refetch: () => Promise<void>;
}

export function usePendingCollections(initialPage = 0, size = 20): UsePendingCollectionsResult {
  const [page, setPage] = useState<number>(initialPage);
  const [pageData, setPageData] = useState<Page<ClaimResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await officerService.listClaims({
        status: 'APPROVED',
        page,
        size,
        sort: 'reviewedAt,desc',
      });
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load pending collections.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const confirmCollection = async (
    claimId: string,
    request?: ConfirmCollectionRequest
  ): Promise<CollectionConfirmationResponse> => {
    setActionLoadingId(claimId);
    try {
      const result = await officerService.confirmCollection(claimId, request);
      await fetchCollections();
      return result;
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    claims: pageData?.content || [],
    pageData,
    isLoading,
    error,
    actionLoadingId,
    page,
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    setPage,
    confirmCollection,
    refetch: fetchCollections,
  };
}
