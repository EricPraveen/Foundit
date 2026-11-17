import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type {
  ClaimResponse,
  OfficerClaimFilterParams,
  ClaimStatus,
  ApproveClaimRequest,
  RejectClaimRequest,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export type OfficerClaimStatusFilter = 'ALL' | ClaimStatus;

export interface UseOfficerClaimsResult {
  claims: ClaimResponse[];
  pageData: Page<ClaimResponse> | null;
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  statusFilter: OfficerClaimStatusFilter;
  setStatusFilter: (status: OfficerClaimStatusFilter) => void;
  itemIdFilter?: string;
  setItemIdFilter: (itemId?: string) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  setPage: (p: number) => void;
  approveClaim: (claimId: string, request?: ApproveClaimRequest) => Promise<ClaimResponse>;
  rejectClaim: (claimId: string, request: RejectClaimRequest) => Promise<ClaimResponse>;
  refetch: () => Promise<void>;
}

export function useOfficerClaims(
  initialParams: OfficerClaimFilterParams = {}
): UseOfficerClaimsResult {
  const [statusFilter, setStatusFilterState] = useState<OfficerClaimStatusFilter>(
    initialParams.status || 'ALL'
  );
  const [itemIdFilter, setItemIdFilterState] = useState<string | undefined>(
    initialParams.itemId
  );
  const [page, setPage] = useState<number>(initialParams.page || 0);
  const [size] = useState<number>(initialParams.size || 20);
  const [pageData, setPageData] = useState<Page<ClaimResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await officerService.listClaims({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        itemId: itemIdFilter,
        page,
        size,
        sort: initialParams.sort || 'submittedAt,desc',
      });
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load claims.'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, itemIdFilter, page, size, initialParams.sort]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const setStatusFilter = (status: OfficerClaimStatusFilter) => {
    setStatusFilterState(status);
    setPage(0);
  };

  const setItemIdFilter = (itemId?: string) => {
    setItemIdFilterState(itemId || undefined);
    setPage(0);
  };

  const approveClaim = async (
    claimId: string,
    request?: ApproveClaimRequest
  ): Promise<ClaimResponse> => {
    setActionLoadingId(claimId);
    try {
      const result = await officerService.approveClaim(claimId, request);
      await fetchClaims();
      return result;
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectClaim = async (
    claimId: string,
    request: RejectClaimRequest
  ): Promise<ClaimResponse> => {
    setActionLoadingId(claimId);
    try {
      const result = await officerService.rejectClaim(claimId, request);
      await fetchClaims();
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
    statusFilter,
    setStatusFilter,
    itemIdFilter,
    setItemIdFilter,
    page,
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    setPage,
    approveClaim,
    rejectClaim,
    refetch: fetchClaims,
  };
}
