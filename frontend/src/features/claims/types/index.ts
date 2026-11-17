/**
 * Claims and Private Evidence Type Definitions matching Spring Boot backend contracts.
 */

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export type EvidenceType = 'STUDENT_ID_CARD' | 'OWNERSHIP_PROOF' | 'ADDITIONAL_PROOF';

export interface ClaimantSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  indexNumber: string;
}

export interface ClaimEvidenceResponse {
  id: string;
  claimId: string;
  evidenceType: EvidenceType;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface ClaimSummaryResponse {
  id: string;
  foundItemId: string;
  foundItemTitle: string;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface ClaimResponse {
  id: string;
  foundItemId: string;
  foundItemTitle: string;
  designatedSecurityOfficeId: string;
  designatedSecurityOfficeName: string;
  claimant: ClaimantSummary;
  ownershipDescription: string;
  status: ClaimStatus;
  reviewingOfficerId?: string | null;
  reviewingOfficerName?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  cancelledAt?: string | null;
  evidence: ClaimEvidenceResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitClaimPayload {
  indexNumber: string;
  ownershipDescription: string;
  studentIdCard: File;
  ownershipProof: File;
  additionalProof?: File;
}
