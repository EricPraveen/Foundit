import { useState, useEffect, useCallback } from 'react';
import { foundItemService } from '../services/foundItemService';
import type { SecurityOfficeResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

let cachedOffice: SecurityOfficeResponse | null = null;

export interface UseSecurityOfficeResult {
  office: SecurityOfficeResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSecurityOffice(options: { autoFetch?: boolean } = {}): UseSecurityOfficeResult {
  const { autoFetch = true } = options;
  const [office, setOffice] = useState<SecurityOfficeResponse | null>(cachedOffice);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedOffice && autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchOffice = useCallback(async (force = false) => {
    if (!force && cachedOffice) {
      setOffice(cachedOffice);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await foundItemService.getCentralSecurityOffice();
      cachedOffice = data;
      setOffice(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load Central Security Office details.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch && !cachedOffice) {
      fetchOffice();
    }
  }, [autoFetch, fetchOffice]);

  return {
    office,
    isLoading,
    error,
    refetch: () => fetchOffice(true),
  };
}

export function resetSecurityOfficeCache(): void {
  cachedOffice = null;
}
