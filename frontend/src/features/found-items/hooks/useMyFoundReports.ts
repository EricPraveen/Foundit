import { useState, useEffect, useCallback, useMemo } from 'react';
import { foundItemService } from '../services/foundItemService';
import type { FoundItemResponse, HandoverStatus, UpdateFoundItemRequest } from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export type StatusTab = 'ALL' | HandoverStatus;

export interface UseMyFoundReportsResult {
  reports: FoundItemResponse[];
  filteredReports: FoundItemResponse[];
  pageData: Page<FoundItemResponse> | null;
  activeStatusTab: StatusTab;
  setActiveStatusTab: (tab: StatusTab) => void;
  statusCounts: {
    ALL: number;
    PENDING: number;
    CONFIRMED: number;
    CANCELLED: number;
  };
  isLoading: boolean;
  error: string | null;
  actionLoadingId: string | null;
  refetch: () => Promise<void>;
  cancelReport: (id: string) => Promise<FoundItemResponse>;
  updateReport: (id: string, request: UpdateFoundItemRequest) => Promise<FoundItemResponse>;
  uploadImage: (id: string, file: File) => Promise<void>;
  deleteImage: (id: string, imageId: string) => Promise<void>;
}

export function useMyFoundReports(page = 0, size = 50): UseMyFoundReportsResult {
  const [pageData, setPageData] = useState<Page<FoundItemResponse> | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await foundItemService.getMyFoundReports(page, size);
      setPageData(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your submitted found reports.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const reports = useMemo(() => pageData?.content || [], [pageData]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: reports.length, PENDING: 0, CONFIRMED: 0, CANCELLED: 0 };
    for (const r of reports) {
      if (r.handoverStatus in counts) {
        counts[r.handoverStatus]++;
      }
    }
    return counts;
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (activeStatusTab === 'ALL') return reports;
    return reports.filter((r) => r.handoverStatus === activeStatusTab);
  }, [reports, activeStatusTab]);

  const cancelReport = useCallback(
    async (id: string): Promise<FoundItemResponse> => {
      setActionLoadingId(id);
      try {
        const updated = await foundItemService.cancelFoundReport(id);
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

  const updateReport = useCallback(
    async (id: string, request: UpdateFoundItemRequest): Promise<FoundItemResponse> => {
      setActionLoadingId(id);
      try {
        const updated = await foundItemService.updateFoundItem(id, request);
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
        const newImage = await foundItemService.uploadImage(id, file);
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
        await foundItemService.deleteImage(id, imageId);
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
    statusCounts,
    isLoading,
    error,
    actionLoadingId,
    refetch: fetchReports,
    cancelReport,
    updateReport,
    uploadImage,
    deleteImage,
  };
}
