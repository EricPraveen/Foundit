import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type {
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
} from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminLocationsResult {
  data: LocationResponse[] | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createLocation: (data: CreateLocationRequest) => Promise<LocationResponse>;
  updateLocation: (id: string, data: UpdateLocationRequest) => Promise<LocationResponse>;
  setLocationStatus: (id: string, active: boolean) => Promise<LocationResponse>;
}

export function useAdminLocations(): UseAdminLocationsResult {
  const [data, setData] = useState<LocationResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllLocations();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load campus locations.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = async (
    createData: CreateLocationRequest
  ): Promise<LocationResponse> => {
    const created = await adminService.createLocation(createData);
    await fetchLocations();
    return created;
  };

  const updateLocation = async (
    id: string,
    updateData: UpdateLocationRequest
  ): Promise<LocationResponse> => {
    const updated = await adminService.updateLocation(id, updateData);
    await fetchLocations();
    return updated;
  };

  const setLocationStatus = async (
    id: string,
    active: boolean
  ): Promise<LocationResponse> => {
    const updated = await adminService.setLocationStatus(id, active);
    await fetchLocations();
    return updated;
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    setLocationStatus,
  };
}
