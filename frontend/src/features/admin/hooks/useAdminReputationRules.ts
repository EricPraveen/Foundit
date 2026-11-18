import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type {
  ReputationRuleResponse,
  UpdateReputationRuleRequest,
} from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseAdminReputationRulesResult {
  data: ReputationRuleResponse[] | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateReputationRule: (id: string, data: UpdateReputationRuleRequest) => Promise<ReputationRuleResponse>;
}

export function useAdminReputationRules(): UseAdminReputationRulesResult {
  const [data, setData] = useState<ReputationRuleResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllReputationRules();
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load reputation rules.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const updateReputationRule = async (
    id: string,
    updateData: UpdateReputationRuleRequest
  ): Promise<ReputationRuleResponse> => {
    const updated = await adminService.updateReputationRule(id, updateData);
    await fetchRules();
    return updated;
  };

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    refetch: fetchRules,
    updateReputationRule,
  };
}
