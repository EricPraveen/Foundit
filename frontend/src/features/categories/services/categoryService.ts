import { apiClient } from '@/lib/api';
import { CategoryResponse } from '../types';

export const categoryService = {
  /**
   * Retrieves all active categories sorted alphabetically for student reporting and browsing.
   */
  async getActiveCategories(): Promise<CategoryResponse[]> {
    return apiClient.get<CategoryResponse[]>('/categories');
  },
};
