import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type {
  AdminUserResponse,
  AdminUserFilterParams,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
} from '../types';
import type { Page } from '@/types/api';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminUsersResult {
  data: Page<AdminUserResponse> | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isFetching: boolean;
  refetch: () => Promise<void>;
  updateUserStatus: (userId: string, data: UpdateUserStatusRequest) => Promise<AdminUserResponse>;
  updateUserRole: (userId: string, data: UpdateUserRoleRequest) => Promise<AdminUserResponse>;
}

export function useAdminUsers(params?: AdminUserFilterParams): UseAdminUsersResult {
  const [data, setData] = useState<Page<AdminUserResponse> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const queryKeyStr = JSON.stringify(params || {});

  const fetchUsers = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await adminService.getUsers(params);
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load user accounts.'));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKeyStr]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserStatus = async (
    userId: string,
    updateData: UpdateUserStatusRequest
  ): Promise<AdminUserResponse> => {
    const updated = await adminService.updateUserStatus(userId, updateData);
    await fetchUsers();
    return updated;
  };

  const updateUserRole = async (
    userId: string,
    updateData: UpdateUserRoleRequest
  ): Promise<AdminUserResponse> => {
    const updated = await adminService.updateUserRole(userId, updateData);
    await fetchUsers();
    return updated;
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    isFetching,
    refetch: fetchUsers,
    updateUserStatus,
    updateUserRole,
  };
}

export interface UseAdminUserResult {
  data: AdminUserResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminUser(userId: string | undefined): UseAdminUserResult {
  const [data, setData] = useState<AdminUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getUserById(userId);
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load user details.'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchUser,
  };
}
