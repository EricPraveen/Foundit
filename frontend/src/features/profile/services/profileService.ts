import { apiClient } from '@/lib/api';
import { UserProfileResponse, UpdateProfileRequest } from '../types';

export const profileService = {
  /**
   * Retrieves the authenticated user's profile.
   * Derived securely from the JWT principal.
   */
  async getProfile(): Promise<UserProfileResponse> {
    return apiClient.get<UserProfileResponse>('/users/me');
  },

  /**
   * Updates permitted fields on the authenticated user's profile (fullName, phoneNumber).
   * Note: Roles, status, email, and points are strictly immutable from this endpoint.
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UserProfileResponse> {
    return apiClient.put<UserProfileResponse>('/users/me', request);
  },
};
