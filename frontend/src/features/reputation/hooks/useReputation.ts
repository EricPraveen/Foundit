import { useState, useEffect, useCallback } from 'react';
import { reputationService } from '../services/reputationService';
import {
  ReputationBalanceResponse,
  ReputationTransactionResponse,
} from '../types';
import { getErrorMessage } from '@/lib/api/apiError';

export interface UseReputationResult {
  balance: ReputationBalanceResponse | null;
  transactions: ReputationTransactionResponse[];
  totalTransactions: number;
  totalPages: number;
  currentPage: number;
  isLoadingBalance: boolean;
  isLoadingTransactions: boolean;
  balanceError: string | null;
  transactionsError: string | null;
  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
}

export function useReputation(initialFetch: boolean = true): UseReputationResult {
  const [balance, setBalance] = useState<ReputationBalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<ReputationTransactionResponse[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);
    try {
      const data = await reputationService.getBalance();
      setBalance(data);
    } catch (err) {
      setBalanceError(getErrorMessage(err, 'Failed to load reputation balance.'));
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number = 0) => {
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const pageData = await reputationService.getTransactions(page, 10);
      setTransactions(pageData.content || []);
      setTotalTransactions(pageData.totalElements ?? 0);
      setTotalPages(pageData.totalPages ?? 0);
      setCurrentPage(pageData.number ?? 0);
    } catch (err) {
      setTransactionsError(getErrorMessage(err, 'Failed to load points history.'));
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetch) {
      fetchBalance();
      fetchTransactions(0);
    }
  }, [initialFetch, fetchBalance, fetchTransactions]);

  return {
    balance,
    transactions,
    totalTransactions,
    totalPages,
    currentPage,
    isLoadingBalance,
    isLoadingTransactions,
    balanceError,
    transactionsError,
    fetchBalance,
    fetchTransactions,
  };
}
