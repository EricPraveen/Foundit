import { apiClient } from '@/lib/api';
import type { Page } from '@/types/api';
import type {
  AdminUserResponse,
  UpdateUserStatusRequest,
  UpdateUserRoleRequest,
  AdminUserFilterParams,
  OfficerProfileResponse,
  CreateOfficerRequest,
  SecurityOfficeResponse,
  UpdateSecurityOfficeRequest,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  ReputationRuleResponse,
  UpdateReputationRuleRequest,
  SystemConfigResponse,
  AuditLogResponse,
  AuditLogFilterParams,
  AdminDashboardMetrics,
} from '../types';
import type { OfficerDashboardResponse } from '@/features/officer/types';

export const adminService = {
  // ---------------------------------------------------------------------------
  // 1. User Governance
  // ---------------------------------------------------------------------------

  /**
   * List users with optional role, status, search query filters, and pagination.
   */
  async getUsers(params?: AdminUserFilterParams): Promise<Page<AdminUserResponse>> {
    const queryParams: Record<string, string | number> = {};

    if (params?.query?.trim()) queryParams.query = params.query.trim();
    if (params?.role) queryParams.role = params.role;
    if (params?.status) queryParams.status = params.status;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    if (params?.sort) queryParams.sort = params.sort;

    return apiClient.get<Page<AdminUserResponse>>('/admin/users', {
      params: queryParams,
    });
  },

  /**
   * Get administrative details for a specific user account.
   */
  async getUserById(userId: string): Promise<AdminUserResponse> {
    return apiClient.get<AdminUserResponse>(`/admin/users/${userId}`);
  },

  /**
   * Update account status (ACTIVE, INACTIVE, SUSPENDED).
   */
  async updateUserStatus(
    userId: string,
    data: UpdateUserStatusRequest
  ): Promise<AdminUserResponse> {
    return apiClient.patch<AdminUserResponse>(`/admin/users/${userId}/status`, data);
  },

  /**
   * Update user role (STUDENT, SECURITY_OFFICER, SUPER_ADMIN).
   */
  async updateUserRole(
    userId: string,
    data: UpdateUserRoleRequest
  ): Promise<AdminUserResponse> {
    return apiClient.patch<AdminUserResponse>(`/admin/users/${userId}/role`, data);
  },

  // ---------------------------------------------------------------------------
  // 2. Security Officers & Central Security Office
  // ---------------------------------------------------------------------------

  /**
   * Retrieve list of all provisioned Security Officers.
   */
  async listOfficers(): Promise<OfficerProfileResponse[]> {
    return apiClient.get<OfficerProfileResponse[]>('/admin/officers');
  },

  /**
   * Provision a new verified Security Officer account.
   */
  async provisionOfficer(data: CreateOfficerRequest): Promise<OfficerProfileResponse> {
    return apiClient.post<OfficerProfileResponse>('/admin/officers', data);
  },

  /**
   * Get public details of Central Security Office.
   */
  async getCentralOffice(): Promise<SecurityOfficeResponse> {
    return apiClient.get<SecurityOfficeResponse>('/security-office');
  },

  /**
   * Update Central Security Office contact, location, and operating hours.
   */
  async updateCentralOffice(data: UpdateSecurityOfficeRequest): Promise<SecurityOfficeResponse> {
    return apiClient.put<SecurityOfficeResponse>('/admin/security-office', data);
  },

  // ---------------------------------------------------------------------------
  // 3. Category Management
  // ---------------------------------------------------------------------------

  /**
   * List all categories (active and inactive) for administrative management.
   */
  async getAllCategories(): Promise<CategoryResponse[]> {
    return apiClient.get<CategoryResponse[]>('/admin/categories');
  },

  /**
   * Create a new item taxonomy category.
   */
  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.post<CategoryResponse>('/admin/categories', data);
  },

  /**
   * Update an existing category name, description, and status.
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    return apiClient.put<CategoryResponse>(`/admin/categories/${id}`, data);
  },

  /**
   * Toggle category active status safely without hard deletion.
   */
  async setCategoryStatus(id: string, active: boolean): Promise<CategoryResponse> {
    return apiClient.patch<CategoryResponse>(`/admin/categories/${id}/status`, null, {
      params: { active },
    });
  },

  // ---------------------------------------------------------------------------
  // 4. Campus Location Management
  // ---------------------------------------------------------------------------

  /**
   * List all campus locations (active and inactive).
   */
  async getAllLocations(): Promise<LocationResponse[]> {
    return apiClient.get<LocationResponse[]>('/admin/locations');
  },

  /**
   * Create a new campus location with optional campus zone.
   */
  async createLocation(data: CreateLocationRequest): Promise<LocationResponse> {
    return apiClient.post<LocationResponse>('/admin/locations', data);
  },

  /**
   * Update an existing campus location.
   */
  async updateLocation(id: string, data: UpdateLocationRequest): Promise<LocationResponse> {
    return apiClient.put<LocationResponse>(`/admin/locations/${id}`, data);
  },

  /**
   * Toggle location active status safely without hard deletion.
   */
  async setLocationStatus(id: string, active: boolean): Promise<LocationResponse> {
    return apiClient.patch<LocationResponse>(`/admin/locations/${id}/status`, null, {
      params: { active },
    });
  },

  // ---------------------------------------------------------------------------
  // 5. Reputation Rules Configuration
  // ---------------------------------------------------------------------------

  /**
   * List all category-based reputation points rules.
   */
  async getAllReputationRules(): Promise<ReputationRuleResponse[]> {
    return apiClient.get<ReputationRuleResponse[]>('/admin/reputation-rules');
  },

  /**
   * Update points or active status for a specific category reputation rule.
   */
  async updateReputationRule(
    id: string,
    data: UpdateReputationRuleRequest
  ): Promise<ReputationRuleResponse> {
    return apiClient.put<ReputationRuleResponse>(`/admin/reputation-rules/${id}`, data);
  },

  // ---------------------------------------------------------------------------
  // 6. System Configuration & Unclaimed Item Policy
  // ---------------------------------------------------------------------------

  /**
   * Retrieve active system configuration, notification parameters, and unclaimed policy.
   */
  async getSystemConfig(): Promise<SystemConfigResponse> {
    return apiClient.get<SystemConfigResponse>('/admin/system-config');
  },

  // ---------------------------------------------------------------------------
  // 7. System Audit Trail
  // ---------------------------------------------------------------------------

  /**
   * Query paginated immutable system audit logs with multi-field filtering.
   */
  async getAuditLogs(params?: AuditLogFilterParams): Promise<Page<AuditLogResponse>> {
    const queryParams: Record<string, string | number> = {};

    if (params?.actorUserId) queryParams.actorUserId = params.actorUserId;
    if (params?.action?.trim()) queryParams.action = params.action.trim();
    if (params?.entityType?.trim()) queryParams.entityType = params.entityType.trim();
    if (params?.entityId?.trim()) queryParams.entityId = params.entityId.trim();
    if (params?.outcome?.trim()) queryParams.outcome = params.outcome.trim();
    if (params?.fromDate) queryParams.fromDate = params.fromDate;
    if (params?.toDate) queryParams.toDate = params.toDate;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;
    if (params?.sort) queryParams.sort = params.sort;

    return apiClient.get<Page<AuditLogResponse>>('/admin/audit-logs', {
      params: queryParams,
    });
  },

  /**
   * Retrieve full details of a specific audit log record.
   */
  async getAuditLogById(id: string): Promise<AuditLogResponse> {
    return apiClient.get<AuditLogResponse>(`/admin/audit-logs/${id}`);
  },

  // ---------------------------------------------------------------------------
  // 8. Administrative Dashboard Aggregates
  // ---------------------------------------------------------------------------

  /**
   * Fetch aggregate operational metrics across platform users, items, and custody.
   */
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    // 1. Fetch system-wide item and custody aggregates via Super Admin officer dashboard call
    const [officerStats, allUsersPage, activeUsersPage, officersList, categoriesList, locationsList] =
      await Promise.all([
        apiClient.get<OfficerDashboardResponse>('/officer/dashboard'),
        apiClient.get<Page<AdminUserResponse>>('/admin/users', { params: { page: 0, size: 1 } }),
        apiClient.get<Page<AdminUserResponse>>('/admin/users', { params: { status: 'ACTIVE', page: 0, size: 1 } }),
        apiClient.get<OfficerProfileResponse[]>('/admin/officers'),
        apiClient.get<CategoryResponse[]>('/admin/categories'),
        apiClient.get<LocationResponse[]>('/admin/locations'),
      ]);

    return {
      totalUsers: allUsersPage.totalElements,
      activeUsers: activeUsersPage.totalElements,
      totalOfficers: officersList.length,
      totalCategories: categoriesList.length,
      totalLocations: locationsList.length,
      availableItems: officerStats.availableItems,
      pendingHandovers: officerStats.pendingHandovers,
      pendingClaims: officerStats.pendingClaims,
      pendingCollection: officerStats.pendingCollection,
      returnedItems: officerStats.returnedItems,
      unclaimedItems: officerStats.unclaimedItems,
      activeLostReports: officerStats.activeLostReports,
    };
  },
};
