import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services/categoryService';
import { CategoryResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

// In-memory cache for active categories to avoid repeated redundant API calls across forms
let cachedCategories: CategoryResponse[] | null = null;

export interface UseCategoriesResult {
  categories: CategoryResponse[];
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => Promise<void>;
}

export function useCategories(options: { autoFetch?: boolean } = {}): UseCategoriesResult {
  const { autoFetch = true } = options;
  const [categories, setCategories] = useState<CategoryResponse[]>(cachedCategories || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedCategories && autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (force: boolean = false) => {
    if (!force && cachedCategories) {
      setCategories(cachedCategories);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await categoryService.getActiveCategories();
      if (data && data.length > 0) {
        cachedCategories = data;
      }
      setCategories(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load categories. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch && (!cachedCategories || categories.length === 0)) {
      fetchCategories();
    }
  }, [autoFetch, categories.length, fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    isEmpty: !isLoading && !error && categories.length === 0,
    refetch: () => fetchCategories(true),
  };
}

export function resetCategoryCache(): void {
  cachedCategories = null;
}
