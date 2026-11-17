import { apiClient } from '@/lib/api';
import type { Page } from '@/types/api';
import type {
  CreateLostReportRequest,
  CancelLostReportRequest,
  ResolveLostReportRequest,
  LostReportImageResponse,
  LostReportResponse,
  UpdateLostReportRequest,
} from '../types';

export const ALLOWED_LOST_REPORT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_LOST_REPORT_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_LOST_REPORT = 3;

/**
 * Validates an image file before upload for a lost report.
 */
export function validateLostReportImage(file: File): void {
  if (!file) {
    throw new Error('Please select a valid image file');
  }

  const normalizedType = file.type.toLowerCase();
  if (!ALLOWED_LOST_REPORT_IMAGE_TYPES.includes(normalizedType)) {
    throw new Error('Unsupported image format. Allowed formats are JPEG, PNG, and WebP.');
  }

  if (file.size > MAX_LOST_REPORT_IMAGE_SIZE) {
    throw new Error('Image file size exceeds the 5 MB limit. Please select a smaller image.');
  }
}

export const lostReportService = {
  /**
   * Retrieves all private lost reports submitted by the authenticated student.
   */
  async getMyLostReports(page = 0, size = 20): Promise<Page<LostReportResponse>> {
    return apiClient.get<Page<LostReportResponse>>('/lost-reports', {
      params: { page, size },
    });
  },

  /**
   * Retrieves a specific private lost report owned by the authenticated student.
   * Cross-student lookups return 404 Not Found to prevent enumeration.
   */
  async getMyLostReportById(id: string): Promise<LostReportResponse> {
    return apiClient.get<LostReportResponse>(`/lost-reports/${id}`);
  },

  /**
   * Submits a private lost item report.
   */
  async createLostReport(request: CreateLostReportRequest): Promise<LostReportResponse> {
    return apiClient.post<LostReportResponse>('/lost-reports', request);
  },

  /**
   * Updates an active lost report. Permitted only while status is ACTIVE.
   */
  async updateLostReport(id: string, request: UpdateLostReportRequest): Promise<LostReportResponse> {
    return apiClient.put<LostReportResponse>(`/lost-reports/${id}`, request);
  },

  /**
   * Cancels/withdraws an active lost report.
   */
  async cancelLostReport(id: string, request?: CancelLostReportRequest): Promise<LostReportResponse> {
    return apiClient.post<LostReportResponse>(`/lost-reports/${id}/cancel`, request || {});
  },

  /**
   * Resolves an active lost report (e.g. owner recovered the item).
   */
  async resolveLostReport(id: string, request?: ResolveLostReportRequest): Promise<LostReportResponse> {
    return apiClient.post<LostReportResponse>(`/lost-reports/${id}/resolve`, request || {});
  },

  /**
   * Uploads an image attachment to a private lost report (max 3 images, max 5MB).
   */
  async uploadImage(id: string, file: File): Promise<LostReportImageResponse> {
    validateLostReportImage(file);

    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<LostReportImageResponse>(`/lost-reports/${id}/images`, formData);
  },

  /**
   * Deletes an image attachment from a private lost report.
   */
  async deleteImage(id: string, imageId: string): Promise<void> {
    return apiClient.delete<void>(`/lost-reports/${id}/images/${imageId}`);
  },
};
