import { apiClient } from '@/lib/api';
import { LocationResponse } from '../types';

export const locationService = {
  /**
   * Retrieves all active campus locations sorted alphabetically for reports and custody.
   */
  async getActiveLocations(): Promise<LocationResponse[]> {
    return apiClient.get<LocationResponse[]>('/locations');
  },
};
