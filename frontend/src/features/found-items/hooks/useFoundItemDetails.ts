import { useState, useEffect, useCallback } from 'react';
import { foundItemService } from '../services/foundItemService';
import type { FoundItemResponse } from '../types';
import { useAuth } from '@/features/auth';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseFoundItemDetailsResult {
  item: FoundItemResponse | null;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  isOfficer: boolean;
  refetch: () => Promise<void>;
}

export function useFoundItemDetails(id?: string): UseFoundItemDetailsResult {
  const { user } = useAuth();
  const [item, setItem] = useState<FoundItemResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) {
      setItem(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await foundItemService.getFoundItemById(id);
      setItem(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load item details.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const isOwner = Boolean(user?.id && item?.discoveredByUserId && item.discoveredByUserId === user.id);
  const isOfficer = Boolean(user?.role === 'SECURITY_OFFICER' || user?.role === 'SUPER_ADMIN');

  return {
    item,
    isLoading,
    error,
    isOwner,
    isOfficer,
    refetch: fetchItem,
  };
}
