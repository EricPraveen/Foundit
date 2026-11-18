import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { AuditLogResponse, AuditLogFilterParams } from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminAuditLogsResult {
  data: Page<AuditLogResponse> | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

export function useAdminAuditLogs(params?: AuditLogFilterParams): UseAdminAuditLogsResult {
  const [data, setData] = useState<Page<AuditLogResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const queryKeyStr = JSON.stringify(params || {});

  const fetchLogs = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await adminService.getAuditLogs(params);
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load audit logs.'));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKeyStr]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    isFetching,
    refetch: fetchLogs,
  };
}

export interface UseAdminAuditLogResult {
  data: AuditLogResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminAuditLog(id: string | undefined): UseAdminAuditLogResult {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAuditLogById(id);
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load audit record details.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchLog,
  };
}
