import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { SystemConfigResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminSystemConfigResult {
  data: SystemConfigResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminSystemConfig(): UseAdminSystemConfigResult {
  const [data, setData] = useState<SystemConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getSystemConfig();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load system configuration.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchConfig,
  };
}
