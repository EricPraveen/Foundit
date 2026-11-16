import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { UserProfileResponse, UpdateProfileRequest } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';
import { useAuth } from '@/features/auth';

export interface UseProfileResult {
  profile: UserProfileResponse | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveError: string | null;
  saveSuccess: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  clearSaveStatus: () => void;
}

export function useProfile(): UseProfileResult {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load user profile. Please try again.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: UpdateProfileRequest): Promise<boolean> => {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      try {
        const updated = await profileService.updateProfile(data);
        setProfile(updated);
        setSaveSuccess(true);
        // Refresh auth state so headers and navigation update
        await refreshUser();
        return true;
      } catch (err) {
        const msg = getErrorMessage(err, 'Failed to update profile. Please check your inputs.');
        setSaveError(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [refreshUser]
  );

  const clearSaveStatus = useCallback(() => {
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    isSaving,
    error,
    saveError,
    saveSuccess,
    fetchProfile,
    updateProfile,
    clearSaveStatus,
  };
}
