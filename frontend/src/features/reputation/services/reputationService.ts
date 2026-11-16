import { apiClient } from '@/lib/api';
import {
  ReputationBalanceResponse,
  ReputationTransactionsPage,
} from '../types';

export const reputationService = {
  /**
   * Retrieves current reputation points balance and lifetime earned total for authenticated user.
   */
  async getBalance(): Promise<ReputationBalanceResponse> {
    return apiClient.get<ReputationBalanceResponse>('/users/me/reputation');
  },

  /**
   * Retrieves paginated reputation points transaction ledger for authenticated user.
   */
  async getTransactions(page: number = 0, size: number = 20): Promise<ReputationTransactionsPage> {
    return apiClient.get<ReputationTransactionsPage>(
      `/users/me/reputation/transactions?page=${page}&size=${size}`
    );
  },
};
