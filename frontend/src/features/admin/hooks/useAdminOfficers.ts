import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type {
  OfficerProfileResponse,
  CreateOfficerRequest,
  SecurityOfficeResponse,
  UpdateSecurityOfficeRequest,
} from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminOfficersResult {
  data: OfficerProfileResponse[] | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  provisionOfficer: (data: CreateOfficerRequest) => Promise<OfficerProfileResponse>;
}

export function useAdminOfficers(): UseAdminOfficersResult {
  const [data, setData] = useState<OfficerProfileResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.listOfficers();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load security officers.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const provisionOfficer = async (
    createData: CreateOfficerRequest
  ): Promise<OfficerProfileResponse> => {
    const created = await adminService.provisionOfficer(createData);
    await fetchOfficers();
    return created;
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchOfficers,
    provisionOfficer,
  };
}

export interface UseCentralOfficeResult {
  data: SecurityOfficeResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateCentralOffice: (data: UpdateSecurityOfficeRequest) => Promise<SecurityOfficeResponse>;
}

export function useCentralOffice(): UseCentralOfficeResult {
  const [data, setData] = useState<SecurityOfficeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getCentralOffice();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load Central Security Office details.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffice();
  }, [fetchOffice]);

  const updateCentralOffice = async (
    updateData: UpdateSecurityOfficeRequest
  ): Promise<SecurityOfficeResponse> => {
    const updated = await adminService.updateCentralOffice(updateData);
    setData(updated);
    return updated;
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchOffice,
    updateCentralOffice,
  };
}
