import { Page } from '@/types/api';

export type ReputationTransactionType =
  | 'FOUND_ITEM_HANDOVER'
  | 'ITEM_COLLECTION'
  | 'ADMIN_ADJUSTMENT';

/**
 * Backend response DTO from GET /api/v1/users/me/reputation.
 */
export interface ReputationBalanceResponse {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalTransactions: number;
}

/**
 * Backend response DTO from GET /api/v1/users/me/reputation/transactions.
 */
export interface ReputationTransactionResponse {
  id: string;
  transactionType: ReputationTransactionType;
  points: number;
  description: string;
  createdAt: string;
}

export type ReputationTransactionsPage = Page<ReputationTransactionResponse>;
