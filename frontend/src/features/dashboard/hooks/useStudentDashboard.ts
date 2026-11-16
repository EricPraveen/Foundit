import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import {
  StudentDashboardStats,
  StudentRecentActivity,
} from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface DashboardSectionErrors {
  foundReports?: string;
  lostReports?: string;
  claims?: string;
  reputation?: string;
}

export interface UseStudentDashboardResult {
  stats: StudentDashboardStats;
  recentActivity: StudentRecentActivity;
  isLoading: boolean;
  errors: DashboardSectionErrors;
  hasErrors: boolean;
  refetchAll: () => Promise<void>;
  refetchSection: (section: 'foundReports' | 'lostReports' | 'claims' | 'reputation') => Promise<void>;
}

export function useStudentDashboard(): UseStudentDashboardResult {
  const [stats, setStats] = useState<StudentDashboardStats>({
    foundReportsCount: null,
    lostReportsCount: null,
    claimsCount: null,
    reputationBalance: null,
    reputationTotalEarned: null,
  });

  const [recentActivity, setRecentActivity] = useState<StudentRecentActivity>({
    recentFoundReports: [],
    recentLostReports: [],
    recentClaims: [],
    recentReputationTransactions: [],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<DashboardSectionErrors>({});

  const refetchSection = useCallback(
    async (section: 'foundReports' | 'lostReports' | 'claims' | 'reputation') => {
      setErrors((prev) => ({ ...prev, [section]: undefined }));
      try {
        switch (section) {
          case 'foundReports': {
            const page = await dashboardService.getMyFoundReports(0, 5);
            setStats((prev) => ({ ...prev, foundReportsCount: page.totalElements }));
            setRecentActivity((prev) => ({ ...prev, recentFoundReports: page.content || [] }));
            break;
          }
          case 'lostReports': {
            const page = await dashboardService.getMyLostReports(0, 5);
            setStats((prev) => ({ ...prev, lostReportsCount: page.totalElements }));
            setRecentActivity((prev) => ({ ...prev, recentLostReports: page.content || [] }));
            break;
          }
          case 'claims': {
            const page = await dashboardService.getMyClaims(0, 5);
            setStats((prev) => ({ ...prev, claimsCount: page.totalElements }));
            setRecentActivity((prev) => ({ ...prev, recentClaims: page.content || [] }));
            break;
          }
          case 'reputation': {
            const [bal, transPage] = await Promise.all([
              dashboardService.getReputationBalance(),
              dashboardService.getRecentReputationTransactions(0, 5),
            ]);
            setStats((prev) => ({
              ...prev,
              reputationBalance: bal.currentBalance,
              reputationTotalEarned: bal.totalEarned,
            }));
            setRecentActivity((prev) => ({
              ...prev,
              recentReputationTransactions: transPage.content || [],
            }));
            break;
          }
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [section]: getErrorMessage(err, `Failed to load ${section}.`),
        }));
      }
    },
    []
  );

  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    setErrors({});

    const [foundRes, lostRes, claimsRes, repRes, transRes] = await Promise.allSettled([
      dashboardService.getMyFoundReports(0, 5),
      dashboardService.getMyLostReports(0, 5),
      dashboardService.getMyClaims(0, 5),
      dashboardService.getReputationBalance(),
      dashboardService.getRecentReputationTransactions(0, 5),
    ]);

    const newErrors: DashboardSectionErrors = {};

    // 1. Found reports
    if (foundRes.status === 'fulfilled') {
      setStats((prev) => ({ ...prev, foundReportsCount: foundRes.value.totalElements }));
      setRecentActivity((prev) => ({ ...prev, recentFoundReports: foundRes.value.content || [] }));
    } else {
      newErrors.foundReports = getErrorMessage(
        foundRes.reason,
        'Failed to load found reports.'
      );
    }

    // 2. Lost reports
    if (lostRes.status === 'fulfilled') {
      setStats((prev) => ({ ...prev, lostReportsCount: lostRes.value.totalElements }));
      setRecentActivity((prev) => ({ ...prev, recentLostReports: lostRes.value.content || [] }));
    } else {
      newErrors.lostReports = getErrorMessage(
        lostRes.reason,
        'Failed to load lost reports.'
      );
    }

    // 3. Claims
    if (claimsRes.status === 'fulfilled') {
      setStats((prev) => ({ ...prev, claimsCount: claimsRes.value.totalElements }));
      setRecentActivity((prev) => ({ ...prev, recentClaims: claimsRes.value.content || [] }));
    } else {
      newErrors.claims = getErrorMessage(
        claimsRes.reason,
        'Failed to load ownership claims.'
      );
    }

    // 4. Reputation balance
    if (repRes.status === 'fulfilled') {
      setStats((prev) => ({
        ...prev,
        reputationBalance: repRes.value.currentBalance,
        reputationTotalEarned: repRes.value.totalEarned,
      }));
    } else {
      newErrors.reputation = getErrorMessage(
        repRes.reason,
        'Failed to load reputation balance.'
      );
    }

    // 5. Recent transactions
    if (transRes.status === 'fulfilled') {
      setRecentActivity((prev) => ({
        ...prev,
        recentReputationTransactions: transRes.value.content || [],
      }));
    }

    setErrors(newErrors);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    stats,
    recentActivity,
    isLoading,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    refetchAll,
    refetchSection,
  };
}
