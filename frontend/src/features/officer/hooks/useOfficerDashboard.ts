import { useState, useEffect, useCallback } from 'react';
import { officerService } from '../services/officerService';
import type { OfficerDashboardResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseOfficerDashboardResult {
  data: OfficerDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOfficerDashboard(): UseOfficerDashboardResult {
  const [data, setData] = useState<OfficerDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await officerService.getDashboard();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load officer dashboard statistics.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
