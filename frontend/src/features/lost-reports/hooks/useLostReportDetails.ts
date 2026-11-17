import { useState, useEffect, useCallback } from 'react';
import { lostReportService } from '../services/lostReportService';
import type { LostReportResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseLostReportDetailsResult {
  report: LostReportResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLostReportDetails(id?: string): UseLostReportDetailsResult {
  const [report, setReport] = useState<LostReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!id) {
      setReport(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await lostReportService.getMyLostReportById(id);
      setReport(data);
    } catch (err: unknown) {
      // 404 represents either missing or private to another user (anti-IDOR)
      setError(getErrorMessage(err, 'Lost report not found or access restricted.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    report,
    isLoading,
    error,
    refetch: fetchReport,
  };
}
