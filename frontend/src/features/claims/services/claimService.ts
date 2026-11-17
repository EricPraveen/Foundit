import { apiClient } from '@/lib/api';
import type { Page } from '@/types/api';
import type {
  ClaimResponse,
  ClaimSummaryResponse,
  SubmitClaimPayload,
} from '../types';

export const ALLOWED_EVIDENCE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
export const MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates a claim evidence file (Student ID, ownership proof, etc.)
 */
export function validateEvidenceFile(file: File, fieldLabel: string): void {
  if (!file) {
    throw new Error(`${fieldLabel} is required.`);
  }

  const normalizedType = file.type.toLowerCase();
  if (!ALLOWED_EVIDENCE_TYPES.includes(normalizedType)) {
    throw new Error(
      `${fieldLabel} must be a valid image (JPEG, PNG, WebP) or PDF document.`
    );
  }

  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error(`${fieldLabel} exceeds the 5 MB maximum file size limit.`);
  }
}

export const claimService = {
  /**
   * Retrieves all claims submitted by the authenticated student.
   */
  async getMyClaims(page = 0, size = 20): Promise<Page<ClaimSummaryResponse>> {
    return apiClient.get<Page<ClaimSummaryResponse>>('/claims/me', {
      params: { page, size },
    });
  },

  /**
   * Retrieves detailed claim info for a claim owned by the student.
   * Cross-student lookups return 404 to prevent ID enumeration.
   */
  async getClaimById(claimId: string): Promise<ClaimResponse> {
    return apiClient.get<ClaimResponse>(`/claims/${claimId}`);
  },

  /**
   * Submits an ownership claim against an available found item.
   */
  async submitClaim(foundItemId: string, payload: SubmitClaimPayload): Promise<ClaimResponse> {
    // Validate evidence files before submitting
    validateEvidenceFile(payload.studentIdCard, 'Student ID Card');
    validateEvidenceFile(payload.ownershipProof, 'Ownership Proof');

    if (payload.additionalProof) {
      validateEvidenceFile(payload.additionalProof, 'Additional Proof');
    }

    const formData = new FormData();
    formData.append('indexNumber', payload.indexNumber.trim());
    formData.append('ownershipDescription', payload.ownershipDescription.trim());
    formData.append('studentIdCard', payload.studentIdCard);
    formData.append('ownershipProof', payload.ownershipProof);

    if (payload.additionalProof) {
      formData.append('additionalProof', payload.additionalProof);
    }

    return apiClient.upload<ClaimResponse>(`/found-items/${foundItemId}/claims`, formData);
  },

  /**
   * Cancels a pending claim owned by the student.
   */
  async cancelClaim(claimId: string): Promise<ClaimResponse> {
    return apiClient.post<ClaimResponse>(`/claims/${claimId}/cancel`);
  },

  /**
   * Downloads a private evidence file stream.
   */
  async downloadEvidence(claimId: string, evidenceId: string): Promise<Blob> {
    return apiClient.get<Blob>(`/claims/${claimId}/evidence/${evidenceId}`, {
      responseType: 'blob',
    });
  },
};
