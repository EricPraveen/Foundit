import { apiClient } from '@/lib/api';
import { Page } from '@/types/api';
import {
  MyFoundReportItem,
  MyLostReportItem,
  MyClaimItem,
} from '../types';
import {
  ReputationBalanceResponse,
  ReputationTransactionResponse,
} from '@/features/reputation/types';

export const dashboardService = {
  /**
   * Retrieves the student's own submitted found reports.
   * `totalElements` provides the authentic count of found reports submitted.
   */
  async getMyFoundReports(page: number = 0, size: number = 5): Promise<Page<MyFoundReportItem>> {
    return apiClient.get<Page<MyFoundReportItem>>(
      `/found-items/me?page=${page}&size=${size}`
    );
  },

  /**
   * Retrieves the student's own submitted private lost reports.
   * `totalElements` provides the authentic count of lost reports submitted.
   */
  async getMyLostReports(page: number = 0, size: number = 5): Promise<Page<MyLostReportItem>> {
    return apiClient.get<Page<MyLostReportItem>>(
      `/lost-reports?page=${page}&size=${size}`
    );
  },

  /**
   * Retrieves the student's own submitted claims.
   * `totalElements` provides the authentic count of claims submitted.
   */
  async getMyClaims(page: number = 0, size: number = 5): Promise<Page<MyClaimItem>> {
    return apiClient.get<Page<MyClaimItem>>(
      `/claims/me?page=${page}&size=${size}`
    );
  },

  /**
   * Retrieves the student's reputation points balance.
   */
  async getReputationBalance(): Promise<ReputationBalanceResponse> {
    return apiClient.get<ReputationBalanceResponse>('/users/me/reputation');
  },

  /**
   * Retrieves the student's recent reputation transactions.
   */
  async getRecentReputationTransactions(
    page: number = 0,
    size: number = 5
  ): Promise<Page<ReputationTransactionResponse>> {
    return apiClient.get<Page<ReputationTransactionResponse>>(
      `/users/me/reputation/transactions?page=${page}&size=${size}`
    );
  },
};
