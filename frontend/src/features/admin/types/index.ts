import type { UserRole, UserStatus } from '@/types/auth';

/**
 * Super Admin User Governance Types
 */
export interface AdminUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  indexNumber: string | null;
  phoneNumber: string | null;
  indexNumberVerified: boolean;
  badgeNumber: string | null;
  securityOfficeId: string | null;
  securityOfficeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
  reason?: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
  badgeNumber?: string;
  reason?: string;
}

export interface AdminUserFilterParams {
  query?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Super Admin Security Officer & Central Security Office Types
 */
export interface OfficerProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  badgeNumber: string | null;
  officeName: string | null;
}

export interface CreateOfficerRequest {
  email: string;
  fullName: string;
  password: string;
  badgeNumber?: string;
}

export interface SecurityOfficeResponse {
  id: string;
  name: string;
  campusLocation: string;
  contactEmail: string | null;
  contactPhone: string | null;
  operatingHours: string | null;
  active: boolean;
}

export interface UpdateSecurityOfficeRequest {
  name: string;
  campusLocation: string;
  contactEmail?: string;
  contactPhone?: string;
  operatingHours?: string;
}

/**
 * Super Admin Category Management Types
 */
export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  active?: boolean;
}

/**
 * Super Admin Campus Location Management Types
 */
export interface LocationResponse {
  id: string;
  name: string;
  campusZone: string | null;
  description: string | null;
  active: boolean;
}

export interface CreateLocationRequest {
  name: string;
  campusZone?: string;
  description?: string;
  active?: boolean;
}

export interface UpdateLocationRequest {
  name: string;
  campusZone?: string;
  description?: string;
  active?: boolean;
}

/**
 * Super Admin Reputation Rules Types
 */
export type ReputationTransactionType = 'FOUND_ITEM_HANDOVER' | 'ITEM_COLLECTION';

export interface ReputationRuleResponse {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  transactionType: ReputationTransactionType;
  points: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReputationRuleRequest {
  points: number;
  active?: boolean;
}

/**
 * Super Admin System Configuration & Unclaimed Policy Types
 */
export interface SystemConfigResponse {
  unclaimedEscalationEnabled: boolean;
  unclaimedThresholdDays: number;
  handoverReminderIntervalHours: number;
  emailNotificationsEnabled: boolean;
  maxEmailRetries: number;
  emailRetryDelaySeconds: number;
  defaultHandoverPoints: number;
  defaultCollectionPoints: number;
  storageProvider: string;
  appBaseUrl: string;
  notice: string;
}

/**
 * Super Admin Audit Trail Types
 */
export interface AuditLogResponse {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  outcome: 'SUCCESS' | 'FAILURE';
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogFilterParams {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  outcome?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Super Admin Global Dashboard Aggregate Metrics
 */
export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalOfficers: number;
  totalCategories: number;
  totalLocations: number;
  availableItems: number;
  pendingHandovers: number;
  pendingClaims: number;
  pendingCollection: number;
  returnedItems: number;
  unclaimedItems: number;
  activeLostReports: number;
}
