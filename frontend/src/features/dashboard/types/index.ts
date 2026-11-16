import { CategoryResponse } from '@/features/categories/types';
import { LocationResponse } from '@/features/locations/types';
import { ReputationTransactionResponse } from '@/features/reputation/types';

export type FoundItemStatus =
  | 'PENDING_HANDOVER'
  | 'AVAILABLE'
  | 'CLAIM_PENDING'
  | 'RETURNED'
  | 'UNCLAIMED'
  | 'EXPIRED';

export type LostReportStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'RECOVERED';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

/**
 * Found item response summary item for student's own reports.
 * Matches backend FoundItemResponse.
 */
export interface MyFoundReportItem {
  id: string;
  title: string;
  description: string;
  category: CategoryResponse;
  location: LocationResponse;
  specificLocation?: string;
  foundAt: string;
  status: FoundItemStatus;
  createdAt: string;
}

/**
 * Lost report response item for student's own reports.
 * Matches backend LostReportResponse.
 */
export interface MyLostReportItem {
  id: string;
  title: string;
  description: string;
  category: CategoryResponse;
  location: LocationResponse;
  specificLocation?: string;
  lostAt: string;
  status: LostReportStatus;
  createdAt: string;
}

/**
 * Claim summary item for student's own submitted claims.
 * Matches backend ClaimSummaryResponse.
 */
export interface MyClaimItem {
  id: string;
  foundItemId: string;
  foundItemTitle: string;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string | null;
}

/**
 * Aggregated summary statistics for the student dashboard.
 * All numbers are derived strictly from authentic Spring Data Page `totalElements`
 * or ReputationBalanceResponse. No values are fabricated or hardcoded.
 */
export interface StudentDashboardStats {
  foundReportsCount: number | null;
  lostReportsCount: number | null;
  claimsCount: number | null;
  reputationBalance: number | null;
  reputationTotalEarned: number | null;
}

/**
 * Recent activities for the student dashboard.
 */
export interface StudentRecentActivity {
  recentFoundReports: MyFoundReportItem[];
  recentLostReports: MyLostReportItem[];
  recentClaims: MyClaimItem[];
  recentReputationTransactions: ReputationTransactionResponse[];
}
