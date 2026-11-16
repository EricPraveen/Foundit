import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';
import { LocationResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

// In-memory cache for active locations to prevent redundant network fetches
let cachedLocations: LocationResponse[] | null = null;

export interface UseLocationsResult {
  locations: LocationResponse[];
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => Promise<void>;
}

export function useLocations(options: { autoFetch?: boolean } = {}): UseLocationsResult {
  const { autoFetch = true } = options;
  const [locations, setLocations] = useState<LocationResponse[]>(cachedLocations || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedLocations && autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async (force: boolean = false) => {
    if (!force && cachedLocations) {
      setLocations(cachedLocations);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await locationService.getActiveLocations();
      if (data && data.length > 0) {
        cachedLocations = data;
      }
      setLocations(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load campus locations. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch && (!cachedLocations || locations.length === 0)) {
      fetchLocations();
    }
  }, [autoFetch, locations.length, fetchLocations]);

  return {
    locations,
    isLoading,
    error,
    isEmpty: !isLoading && !error && locations.length === 0,
    refetch: () => fetchLocations(true),
  };
}

export function resetLocationCache(): void {
  cachedLocations = null;
}
