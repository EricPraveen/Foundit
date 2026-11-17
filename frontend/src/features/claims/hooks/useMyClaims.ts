import { useState, useEffect, useCallback, useMemo } from 'react';
import { claimService } from '../services/claimService';
import type { ClaimResponse, ClaimStatus, ClaimSummaryResponse } from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export type ClaimStatusFilter = 'ALL' | ClaimStatus;

export interface UseMyClaimsResult {
  claims: ClaimSummaryResponse[];
  filteredClaims: ClaimSummaryResponse[];
  pageData: Page<ClaimSummaryResponse> | null;
  statusFilter: ClaimStatusFilter;
  setStatusFilter: (filter: ClaimStatusFilter) => void;
  statusCounts: Record<ClaimStatusFilter, number>;
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
  cancelClaim: (claimId: string) => Promise<ClaimResponse>;
}

export function useMyClaims(initialPage = 0, size = 20): UseMyClaimsResult {
  const [page, setPage] = useState<number>(initialPage);
  const [pageData, setPageData] = useState<Page<ClaimSummaryResponse> | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await claimService.getMyClaims(page, size);
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your claims.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const claims = useMemo(() => pageData?.content || [], [pageData]);

  const statusCounts = useMemo(() => {
    const counts: Record<ClaimStatusFilter, number> = {
      ALL: claims.length,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    };
    for (const c of claims) {
      if (c.status in counts) {
        counts[c.status]++;
      }
    }
    return counts;
  }, [claims]);

  const filteredClaims = useMemo(() => {
    if (statusFilter === 'ALL') return claims;
    return claims.filter((c: ClaimSummaryResponse) => c.status === statusFilter);
  }, [claims, statusFilter]);

  const cancelClaim = useCallback(async (claimId: string): Promise<ClaimResponse> => {
    setActionLoadingId(claimId);
    try {
      const updated = await claimService.cancelClaim(claimId);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((item) =>
            item.id === claimId
              ? {
                  ...item,
                  status: updated.status,
                }
              : item
          ),
        };
      });
      return updated;
    } finally {
      setActionLoadingId(null);
    }
  }, []);

  return {
    claims,
    filteredClaims,
    pageData,
    statusFilter,
    setStatusFilter,
    statusCounts,
    isLoading,
    error,
    actionLoadingId,
    page,
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    setPage,
    refetch: fetchClaims,
    cancelClaim,
  };
}
