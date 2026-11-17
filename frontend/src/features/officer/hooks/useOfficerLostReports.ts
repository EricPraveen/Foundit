import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type {
  LostReportResponse,
  OfficerLostReportFilterParams,
  LostReportStatus,
  ResolveLostReportOfficerRequest,
  CancelLostReportOfficerRequest,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export type OfficerLostReportStatusFilter = 'ALL' | LostReportStatus;

export interface UseOfficerLostReportsResult {
  reports: LostReportResponse[];
  pageData: Page<LostReportResponse> | null;
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  statusFilter: OfficerLostReportStatusFilter;
  setStatusFilter: (status: OfficerLostReportStatusFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  categoryId?: string;
  setCategoryId: (id?: string) => void;
  locationId?: string;
  setLocationId: (id?: string) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  setPage: (p: number) => void;
  resolveReport: (id: string, request?: ResolveLostReportOfficerRequest) => Promise<LostReportResponse>;
  cancelReport: (id: string, request?: CancelLostReportOfficerRequest) => Promise<LostReportResponse>;
  refetch: () => Promise<void>;
}

export function useOfficerLostReports(
  initialParams: OfficerLostReportFilterParams = {}
): UseOfficerLostReportsResult {
  const [statusFilter, setStatusFilterState] = useState<OfficerLostReportStatusFilter>(
    initialParams.status || 'ALL'
  );
  const [query, setQueryState] = useState<string>(initialParams.query || '');
  const [categoryId, setCategoryIdState] = useState<string | undefined>(initialParams.categoryId);
  const [locationId, setLocationIdState] = useState<string | undefined>(initialParams.locationId);
  const [page, setPage] = useState<number>(initialParams.page || 0);
  const [size] = useState<number>(initialParams.size || 20);
  const [pageData, setPageData] = useState<Page<LostReportResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await officerService.searchLostReports({
        query: query.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        categoryId: categoryId || undefined,
        locationId: locationId || undefined,
        page,
        size,
        sort: initialParams.sort || 'createdAt,desc',
      });
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load lost reports.'));
    } finally {
      setIsLoading(false);
    }
  }, [query, statusFilter, categoryId, locationId, page, size, initialParams.sort]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const setStatusFilter = (status: OfficerLostReportStatusFilter) => {
    setStatusFilterState(status);
    setPage(0);
  };

  const setQuery = (q: string) => {
    setQueryState(q);
    setPage(0);
  };

  const setCategoryId = (id?: string) => {
    setCategoryIdState(id || undefined);
    setPage(0);
  };

  const setLocationId = (id?: string) => {
    setLocationIdState(id || undefined);
    setPage(0);
  };

  const resolveReport = async (
    id: string,
    request?: ResolveLostReportOfficerRequest
  ): Promise<LostReportResponse> => {
    setActionLoadingId(id);
    try {
      const result = await officerService.resolveLostReport(id, request);
      await fetchReports();
      return result;
    } finally {
      setActionLoadingId(null);
    }
  };

  const cancelReport = async (
    id: string,
    request?: CancelLostReportOfficerRequest
  ): Promise<LostReportResponse> => {
    setActionLoadingId(id);
    try {
      const result = await officerService.cancelLostReport(id, request);
      await fetchReports();
      return result;
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    reports: pageData?.content || [],
    pageData,
    isLoading,
    error,
    actionLoadingId,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    categoryId,
    setCategoryId,
    locationId,
    setLocationId,
    page,
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    setPage,
    resolveReport,
    cancelReport,
    refetch: fetchReports,
  };
}
