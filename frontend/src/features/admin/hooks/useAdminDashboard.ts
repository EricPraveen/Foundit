import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { AdminDashboardMetrics } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminDashboardResult {
  data: AdminDashboardMetrics | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFetching: boolean;
}

export function useAdminDashboard(): UseAdminDashboardResult {
  const [data, setData] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const result = await adminService.getDashboardMetrics();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load administrative dashboard statistics.'));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchDashboard,
    isFetching,
  };
}
