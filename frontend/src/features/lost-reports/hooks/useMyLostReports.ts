import { useState, useEffect, useCallback, useMemo } from 'react';
import { lostReportService } from '../services/lostReportService';
import type {
  LostReportResponse,
  LostReportStatus,
  UpdateLostReportRequest,
  CancelLostReportRequest,
  ResolveLostReportRequest,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export type LostStatusTab = 'ALL' | LostReportStatus;
export type LostReportStatusFilter = LostStatusTab;

export interface UseMyLostReportsResult {
  reports: LostReportResponse[];
  filteredReports: LostReportResponse[];
  pageData: Page<LostReportResponse> | null;
  activeStatusTab: LostStatusTab;
  setActiveStatusTab: (tab: LostStatusTab) => void;
  statusFilter: LostStatusTab;
  setStatusFilter: (tab: LostStatusTab) => void;
  statusCounts: Record<LostStatusTab, number>;
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  refetch: () => Promise<void>;
  updateReport: (id: string, request: UpdateLostReportRequest) => Promise<LostReportResponse>;
  resolveReport: (id: string, request?: ResolveLostReportRequest) => Promise<LostReportResponse>;
  cancelReport: (id: string, request?: CancelLostReportRequest) => Promise<LostReportResponse>;
  uploadImage: (id: string, file: File) => Promise<void>;
  deleteImage: (id: string, imageId: string) => Promise<void>;
}

export function useMyLostReports(initialPage = 0, size = 50): UseMyLostReportsResult {
  const [page, setPage] = useState<number>(initialPage);
  const [pageData, setPageData] = useState<Page<LostReportResponse> | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<LostStatusTab>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lostReportService.getMyLostReports(page, size);
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your lost reports.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const reports = useMemo(() => pageData?.content || [], [pageData]);

  const statusCounts = useMemo(() => {
    const counts: Record<LostStatusTab, number> = {
      ALL: reports.length,
      ACTIVE: 0,
      RESOLVED: 0,
      RECOVERED: 0,
      CANCELLED: 0,
    };
    for (const r of reports) {
      if (r.status in counts) {
        counts[r.status]++;
      }
    }
    return counts;
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (activeStatusTab === 'ALL') return reports;
    return reports.filter((r) => r.status === activeStatusTab);
  }, [reports, activeStatusTab]);

  const updateReport = useCallback(
    async (id: string, request: UpdateLostReportRequest): Promise<LostReportResponse> => {
      setActionLoadingId(id);
      try {
        const updated = await lostReportService.updateLostReport(id, request);
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content.map((item) => (item.id === id ? updated : item)),
          };
        });
        return updated;
      } finally {
        setActionLoadingId(null);
      }
    },
    []
  );

  const resolveReport = useCallback(
    async (id: string, request?: ResolveLostReportRequest): Promise<LostReportResponse> => {
      setActionLoadingId(id);
      try {
        const updated = await lostReportService.resolveLostReport(id, request);
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content.map((item) => (item.id === id ? updated : item)),
          };
        });
        return updated;
      } finally {
        setActionLoadingId(null);
      }
    },
    []
  );

  const cancelReport = useCallback(
    async (id: string, request?: CancelLostReportRequest): Promise<LostReportResponse> => {
      setActionLoadingId(id);
      try {
        const updated = await lostReportService.cancelLostReport(id, request);
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content.map((item) => (item.id === id ? updated : item)),
          };
        });
        return updated;
      } finally {
        setActionLoadingId(null);
      }
    },
    []
  );

  const uploadImage = useCallback(
    async (id: string, file: File): Promise<void> => {
      setActionLoadingId(id);
      try {
        const newImage = await lostReportService.uploadImage(id, file);
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                images: [...(item.images || []), newImage],
              };
            }),
          };
        });
      } finally {
        setActionLoadingId(null);
      }
    },
    []
  );

  const deleteImage = useCallback(
    async (id: string, imageId: string): Promise<void> => {
      setActionLoadingId(id);
      try {
        await lostReportService.deleteImage(id, imageId);
        setPageData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                images: (item.images || []).filter((img) => img.id !== imageId),
              };
            }),
          };
        });
      } finally {
        setActionLoadingId(null);
      }
    },
    []
  );

  return {
    reports,
    filteredReports,
    pageData,
    activeStatusTab,
    setActiveStatusTab,
    statusFilter: activeStatusTab,
    setStatusFilter: setActiveStatusTab,
    statusCounts,
    isLoading,
    error,
    actionLoadingId,
    page,
    totalPages: pageData?.totalPages || 0,
    setPage,
    refetch: fetchReports,
    updateReport,
    resolveReport,
    cancelReport,
    uploadImage,
    deleteImage,
  };
}
