/**
 * Security Officer Portal Types and DTOs
 * Strictly aligned with Spring Boot backend OpenAPI contracts and domain invariants.
 */
import type { HandoverStatus, ItemAvailabilityStatus, FoundItemResponse } from '@/features/found-items/types';
import type { ClaimStatus, ClaimResponse, ClaimEvidenceResponse } from '@/features/claims/types';
import type { LostReportStatus, LostReportResponse } from '@/features/lost-reports/types';

export interface OfficerDashboardResponse {
  availableItems: number;
  pendingHandovers: number;
  pendingClaims: number;
  pendingCollection: number;
  returnedItems: number;
  unclaimedItems: number;
  activeLostReports: number;
  officeId: string | null;
  officeName: string | null;
}

export interface HandoverLogResponse {
  id: string;
  foundItemId: string;
  finderId: string;
  receivingOfficerId: string;
  securityOfficeId: string;
  handoverConfirmedAt: string;
  notes?: string | null;
  createdAt: string;
}

export interface CollectionConfirmationResponse {
  collectionId: string;
  claimId: string;
  foundItemId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  confirmingOfficerId: string;
  confirmingOfficerName: string;
  collectedAt: string;
  claimStatus: ClaimStatus;
  itemAvailabilityStatus: ItemAvailabilityStatus;
  linkedLostReportId?: string | null;
  lostReportStatus?: LostReportStatus | null;
  officerNotes?: string | null;
  pointsAwarded: number;
}

export interface LostReportAuditLogResponse {
  id: string;
  lostReportId: string;
  actorId: string;
  actorRole: string;
  action: string;
  previousStatus?: string | null;
  newStatus: string;
  details?: string | null;
  createdAt: string;
}

export interface ConfirmHandoverRequest {
  officerNotes?: string;
}

export interface ApproveClaimRequest {
  reviewNotes?: string;
}

export interface RejectClaimRequest {
  rejectionReason: string;
}

export interface ConfirmCollectionRequest {
  officerNotes?: string;
  linkedLostReportId?: string;
}

export interface ResolveLostReportOfficerRequest {
  resolutionNotes?: string;
}

export interface CancelLostReportOfficerRequest {
  cancellationReason?: string;
}

export interface OfficerFoundItemFilterParams {
  availabilityStatus?: ItemAvailabilityStatus;
  handoverStatus?: HandoverStatus;
  categoryId?: string;
  locationId?: string;
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface OfficerClaimFilterParams {
  status?: ClaimStatus;
  itemId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface OfficerLostReportFilterParams {
  query?: string;
  status?: LostReportStatus;
  categoryId?: string;
  locationId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export type {
  FoundItemResponse,
  ClaimResponse,
  ClaimEvidenceResponse,
  LostReportResponse,
  HandoverStatus,
  ItemAvailabilityStatus,
  ClaimStatus,
  LostReportStatus,
};
