import { apiClient } from '@/lib/api';
import type { Page } from '@/types/api';
import type {
  OfficerDashboardResponse,
  HandoverLogResponse,
  CollectionConfirmationResponse,
  LostReportAuditLogResponse,
  ConfirmHandoverRequest,
  ApproveClaimRequest,
  RejectClaimRequest,
  ConfirmCollectionRequest,
  ResolveLostReportOfficerRequest,
  CancelLostReportOfficerRequest,
  OfficerFoundItemFilterParams,
  OfficerClaimFilterParams,
  OfficerLostReportFilterParams,
  FoundItemResponse,
  ClaimResponse,
  LostReportResponse,
} from '../types';

export const officerService = {
  /**
   * Retrieves Central Security Office operational dashboard metrics.
   */
  async getDashboard(): Promise<OfficerDashboardResponse> {
    return apiClient.get<OfficerDashboardResponse>('/officer/dashboard');
  },

  /**
   * Retrieves paginated items awaiting physical handover at the officer's designated Security Office.
   */
  async getPendingHandovers(page = 0, size = 20): Promise<Page<FoundItemResponse>> {
    return apiClient.get<Page<FoundItemResponse>>('/officer/found-items/pending-handover', {
      params: { page, size },
    });
  },

  /**
   * Retrieves pending handovers created more than N hours ago without physical custody.
   */
  async getOverdueHandovers(hours = 24): Promise<FoundItemResponse[]> {
    return apiClient.get<FoundItemResponse[]>('/officer/found-items/overdue-handover', {
      params: { hours },
    });
  },

  /**
   * Security Officer physically verifies and confirms receipt of a found item.
   * Transitions item status from PENDING_HANDOVER to AVAILABLE and awards category reputation points.
   */
  async confirmHandover(
    id: string,
    payload?: ConfirmHandoverRequest
  ): Promise<FoundItemResponse> {
    return apiClient.post<FoundItemResponse>(`/officer/found-items/${id}/confirm-handover`, payload);
  },

  /**
   * Retrieves immutable physical handover history for a found item.
   */
  async getHandoverHistory(id: string): Promise<HandoverLogResponse[]> {
    return apiClient.get<HandoverLogResponse[]>(`/officer/found-items/${id}/handover-history`);
  },

  /**
   * Lists and filters found items within officer office scope.
   */
  async listFoundItems(params: OfficerFoundItemFilterParams = {}): Promise<Page<FoundItemResponse>> {
    const cleanParams: Record<string, unknown> = {};
    if (params.availabilityStatus) cleanParams.availabilityStatus = params.availabilityStatus;
    if (params.handoverStatus) cleanParams.handoverStatus = params.handoverStatus;
    if (params.categoryId) cleanParams.categoryId = params.categoryId;
    if (params.locationId) cleanParams.locationId = params.locationId;
    if (params.query?.trim()) cleanParams.query = params.query.trim();
    cleanParams.page = params.page ?? 0;
    cleanParams.size = params.size ?? 20;
    if (params.sort) cleanParams.sort = params.sort;

    return apiClient.get<Page<FoundItemResponse>>('/officer/found-items', {
      params: cleanParams,
    });
  },

  /**
   * Retrieves details for a specific found item with officer privileges (includes unmasked finder details).
   */
  async getFoundItemById(id: string): Promise<FoundItemResponse> {
    return apiClient.get<FoundItemResponse>(`/found-items/${id}`);
  },

  /**
   * Retrieves physical collection confirmation log for a returned found item.
   */
  async getCollectionByFoundItemId(id: string): Promise<CollectionConfirmationResponse> {
    return apiClient.get<CollectionConfirmationResponse>(`/officer/found-items/${id}/collection`);
  },

  /**
   * Lists submitted ownership claims for found items assigned to the officer's security office.
   */
  async listClaims(params: OfficerClaimFilterParams = {}): Promise<Page<ClaimResponse>> {
    const cleanParams: Record<string, unknown> = {};
    if (params.status) cleanParams.status = params.status;
    if (params.itemId) cleanParams.itemId = params.itemId;
    cleanParams.page = params.page ?? 0;
    cleanParams.size = params.size ?? 20;
    if (params.sort) cleanParams.sort = params.sort;

    return apiClient.get<Page<ClaimResponse>>('/officer/claims', {
      params: cleanParams,
    });
  },

  /**
   * Retrieves full claim details including claimant summary and evidence metadata for officer review.
   */
  async getClaimById(claimId: string): Promise<ClaimResponse> {
    return apiClient.get<ClaimResponse>(`/officer/claims/${claimId}`);
  },

  /**
   * Approves an ownership claim after verifying claimant evidence. Marks item CLAIM_PENDING.
   */
  async approveClaim(claimId: string, payload?: ApproveClaimRequest): Promise<ClaimResponse> {
    return apiClient.post<ClaimResponse>(`/officer/claims/${claimId}/approve`, payload);
  },

  /**
   * Rejects an ownership claim with a mandatory justification reason. Item remains AVAILABLE.
   */
  async rejectClaim(claimId: string, payload: RejectClaimRequest): Promise<ClaimResponse> {
    return apiClient.post<ClaimResponse>(`/officer/claims/${claimId}/reject`, payload);
  },

  /**
   * Streams private claim evidence file (Student ID Card, ownership proof) for officer inspection.
   */
  async downloadEvidence(claimId: string, evidenceId: string): Promise<Blob> {
    return apiClient.get<Blob>(`/officer/claims/${claimId}/evidence/${evidenceId}`, {
      responseType: 'blob',
    });
  },

  /**
   * Confirms physical collection of an approved claimed item from the Central Security Office.
   * Atomically completes claim (COMPLETED), marks item RETURNED, updates linked lost report to RECOVERED (if linked),
   * and awards reputation points.
   */
  async confirmCollection(
    claimId: string,
    payload?: ConfirmCollectionRequest
  ): Promise<CollectionConfirmationResponse> {
    return apiClient.post<CollectionConfirmationResponse>(
      `/officer/claims/${claimId}/confirm-collection`,
      payload
    );
  },

  /**
   * Retrieves physical collection confirmation log for a claim.
   */
  async getCollectionByClaimId(claimId: string): Promise<CollectionConfirmationResponse> {
    return apiClient.get<CollectionConfirmationResponse>(`/officer/claims/${claimId}/collection`);
  },

  /**
   * Searches and lists private lost reports within officer office scope.
   */
  async searchLostReports(params: OfficerLostReportFilterParams = {}): Promise<Page<LostReportResponse>> {
    const cleanParams: Record<string, unknown> = {};
    if (params.query?.trim()) cleanParams.query = params.query.trim();
    if (params.status) cleanParams.status = params.status;
    if (params.categoryId) cleanParams.categoryId = params.categoryId;
    if (params.locationId) cleanParams.locationId = params.locationId;
    if (params.fromDate) cleanParams.fromDate = params.fromDate;
    if (params.toDate) cleanParams.toDate = params.toDate;
    cleanParams.page = params.page ?? 0;
    cleanParams.size = params.size ?? 20;
    if (params.sort) cleanParams.sort = params.sort;

    return apiClient.get<Page<LostReportResponse>>('/officer/lost-reports', {
      params: cleanParams,
    });
  },

  /**
   * Retrieves lost report details including student contact information for officer investigation.
   */
  async getLostReportById(id: string): Promise<LostReportResponse> {
    return apiClient.get<LostReportResponse>(`/officer/lost-reports/${id}`);
  },

  /**
   * Security Officer marks a lost report as resolved after operational assistance.
   */
  async resolveLostReport(
    id: string,
    payload?: ResolveLostReportOfficerRequest
  ): Promise<LostReportResponse> {
    return apiClient.post<LostReportResponse>(`/officer/lost-reports/${id}/resolve`, payload);
  },

  /**
   * Security Officer cancels an invalid or withdrawn lost report.
   */
  async cancelLostReport(
    id: string,
    payload?: CancelLostReportOfficerRequest
  ): Promise<LostReportResponse> {
    return apiClient.post<LostReportResponse>(`/officer/lost-reports/${id}/cancel`, payload);
  },

  /**
   * Retrieves immutable lifecycle audit logs for a lost report.
   */
  async getLostReportAuditHistory(id: string): Promise<LostReportAuditLogResponse[]> {
    return apiClient.get<LostReportAuditLogResponse[]>(`/officer/lost-reports/${id}/audit-history`);
  },
};
