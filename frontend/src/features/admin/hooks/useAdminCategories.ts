import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type {
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminCategoriesResult {
  data: CategoryResponse[] | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<CategoryResponse>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<CategoryResponse>;
  setCategoryStatus: (id: string, active: boolean) => Promise<CategoryResponse>;
}

export function useAdminCategories(): UseAdminCategoriesResult {
  const [data, setData] = useState<CategoryResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllCategories();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load categories.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (
    createData: CreateCategoryRequest
  ): Promise<CategoryResponse> => {
    const created = await adminService.createCategory(createData);
    await fetchCategories();
    return created;
  };

  const updateCategory = async (
    id: string,
    updateData: UpdateCategoryRequest
  ): Promise<CategoryResponse> => {
    const updated = await adminService.updateCategory(id, updateData);
    await fetchCategories();
    return updated;
  };

  const setCategoryStatus = async (
    id: string,
    active: boolean
  ): Promise<CategoryResponse> => {
    const updated = await adminService.setCategoryStatus(id, active);
    await fetchCategories();
    return updated;
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    setCategoryStatus,
  };
}
