/**
 * Found Items & Security Office Handover Type Definitions
 * Strictly adhering to backend Spring Boot DTO contracts and domain invariants.
 */

export type HandoverStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type ItemAvailabilityStatus =
  | 'UNAVAILABLE'
  | 'AVAILABLE'
  | 'CLAIM_PENDING'
  | 'COLLECTED'
  | 'RETURNED'
  | 'DISPOSED'
  | 'UNCLAIMED';

export interface FoundItemImageResponse {
  id: string;
  originalFilename: string;
  storagePath: string;
  publicUrl: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface FoundItemResponse {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  locationId: string;
  locationName: string;
  specificLocation?: string | null;
  foundAt: string;
  designatedSecurityOfficeId: string;
  designatedSecurityOfficeName: string;
  handoverStatus: HandoverStatus;
  availabilityStatus: ItemAvailabilityStatus;
  discoveredByUserId?: string | null;
  finderName?: string | null;
  receivedByOfficerId?: string | null;
  receivingOfficerName?: string | null;
  handoverConfirmedAt?: string | null;
  officerNotes?: string | null;
  images: FoundItemImageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FoundItemSummaryResponse {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  locationId: string;
  locationName: string;
  specificLocation?: string | null;
  foundAt: string;
  availabilityStatus: ItemAvailabilityStatus;
  imageUrls: string[];
  createdAt: string;
}

export interface CreateFoundItemRequest {
  title: string;
  description: string;
  categoryId: string;
  locationId: string;
  specificLocation?: string;
  foundAt: string; // ISO 8601 string
  designatedSecurityOfficeId: string;
}

export interface UpdateFoundItemRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  locationId?: string;
  specificLocation?: string;
}

export interface FoundItemFilterParams {
  query?: string;
  categoryId?: string;
  locationId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface SecurityOfficeResponse {
  id: string;
  name: string;
  campusLocation: string;
  contactEmail: string;
  contactPhone: string;
  operatingHours: string;
  active: boolean;
}
