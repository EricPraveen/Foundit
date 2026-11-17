import { apiClient, API_BASE_URL } from '@/lib/api';
import type { Page } from '@/types/api';
import type {
  CreateFoundItemRequest,
  FoundItemFilterParams,
  FoundItemImageResponse,
  FoundItemResponse,
  FoundItemSummaryResponse,
  SecurityOfficeResponse,
  UpdateFoundItemRequest,
} from '../types';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_ITEM = 5;

/**
 * Validates a single image file before sending it to the backend.
 * Throws an Error with a user-friendly message if invalid.
 */
export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('Please select a valid image file');
  }

  const normalizedType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
    throw new Error('Unsupported image format. Allowed formats are JPEG, PNG, and WebP.');
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error('Image file size exceeds the 5 MB limit. Please choose a smaller image.');
  }
}

/**
 * Resolves a storage path or relative URL into an absolute URL for image display.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  // Remove trailing /api/v1 from API_BASE_URL to get the server origin
  const baseOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseOrigin}${cleanPath}`;
}

export const foundItemService = {
  /**
   * Browse verified, available found items (Public endpoint).
   * Only returns items confirmed by Security Officers in AVAILABLE status.
   */
  async getAvailableFoundItems(
    params: FoundItemFilterParams = {}
  ): Promise<Page<FoundItemSummaryResponse>> {
    const queryParams: Record<string, string | number> = {};

    if (params.query?.trim()) queryParams.query = params.query.trim();
    if (params.categoryId) queryParams.categoryId = params.categoryId;
    if (params.locationId) queryParams.locationId = params.locationId;
    if (params.fromDate) queryParams.fromDate = params.fromDate;
    if (params.toDate) queryParams.toDate = params.toDate;
    if (typeof params.page === 'number') queryParams.page = params.page;
    if (typeof params.size === 'number') queryParams.size = params.size;
    if (params.sort) queryParams.sort = params.sort;

    return apiClient.get<Page<FoundItemSummaryResponse>>('/found-items', {
      params: queryParams,
    });
  },

  /**
   * Retrieves single item details.
   * Finder info is masked for public users; unmasked for owner or officer.
   */
  async getFoundItemById(id: string): Promise<FoundItemResponse> {
    return apiClient.get<FoundItemResponse>(`/found-items/${id}`);
  },

  /**
   * Retrieves all found reports submitted by the authenticated student.
   * Includes pending handover, confirmed, and cancelled reports.
   */
  async getMyFoundReports(page = 0, size = 20): Promise<Page<FoundItemResponse>> {
    return apiClient.get<Page<FoundItemResponse>>('/found-items/me', {
      params: { page, size },
    });
  },

  /**
   * Reports a found item. Report is created with PENDING_HANDOVER & UNAVAILABLE status.
   */
  async reportFoundItem(request: CreateFoundItemRequest): Promise<FoundItemResponse> {
    return apiClient.post<FoundItemResponse>('/found-items', request);
  },

  /**
   * Updates a pending found item report before physical handover.
   * Only permitted for finder while in PENDING status.
   */
  async updateFoundItem(id: string, request: UpdateFoundItemRequest): Promise<FoundItemResponse> {
    return apiClient.put<FoundItemResponse>(`/found-items/${id}`, request);
  },

  /**
   * Cancels a pending found item report before physical handover.
   * Only permitted for finder while in PENDING status.
   */
  async cancelFoundReport(id: string): Promise<FoundItemResponse> {
    return apiClient.post<FoundItemResponse>(`/found-items/${id}/cancel`);
  },

  /**
   * Uploads an image attachment to a found item report.
   * Max 5 images per item, max 5 MB each.
   */
  async uploadImage(id: string, file: File): Promise<FoundItemImageResponse> {
    validateImageFile(file);

    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<FoundItemImageResponse>(`/found-items/${id}/images`, formData);
  },

  /**
   * Deletes an image attachment from a found item report.
   */
  async deleteImage(id: string, imageId: string): Promise<void> {
    return apiClient.delete<void>(`/found-items/${id}/images/${imageId}`);
  },

  /**
   * Retrieves active Central Security Office details (location, contacts, hours).
   */
  async getCentralSecurityOffice(): Promise<SecurityOfficeResponse> {
    return apiClient.get<SecurityOfficeResponse>('/security-office');
  },
};
