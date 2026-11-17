import { useState, useEffect, useCallback } from 'react';
import { claimService } from '../services/claimService';
import type { ClaimResponse } from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseClaimDetailsResult {
  claim: ClaimResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  downloadEvidence: (evidenceId: string, filename: string) => Promise<void>;
  isDownloading: boolean;
}

export function useClaimDetails(claimId?: string): UseClaimDetailsResult {
  const [claim, setClaim] = useState<ClaimResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(claimId));
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const fetchClaim = useCallback(async () => {
    if (!claimId) {
      setClaim(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await claimService.getClaimById(claimId);
      setClaim(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Claim not found or access restricted.'));
    } finally {
      setIsLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  const downloadEvidence = useCallback(
    async (evidenceId: string, filename: string) => {
      if (!claimId) return;
      try {
        setIsDownloading(true);
        const blob = await claimService.downloadEvidence(claimId, evidenceId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `evidence-${evidenceId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Failed to download evidence:', err);
        throw err;
      } finally {
        setIsDownloading(false);
      }
    },
    [claimId]
  );

  return {
    claim,
    isLoading,
    error,
    refetch: fetchClaim,
    downloadEvidence,
    isDownloading,
  };
}
