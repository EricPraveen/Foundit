/**
 * Private Lost Reports Type Definitions matching Spring Boot backend DTO contracts.
 */
import type { CategoryResponse } from '@/features/categories/types';
import type { LocationResponse } from '@/features/locations/types';
import type { SecurityOfficeResponse } from '@/features/found-items/types';

export type LostReportStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'RECOVERED';

export interface LostReportImageResponse {
  id: string;
  originalFilename: string;
  publicUrl: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface StudentContactInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface LostReportResponse {
  id: string;
  title: string;
  description: string;
  distinctiveFeatures?: string | null;
  category: CategoryResponse;
  location: LocationResponse;
  specificLocation?: string | null;
  lostAt: string; // ISO 8601
  designatedSecurityOffice: SecurityOfficeResponse;
  status: LostReportStatus;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  images: LostReportImageResponse[];
  studentContact?: StudentContactInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLostReportRequest {
  title: string;
  description: string;
  distinctiveFeatures?: string;
  categoryId: string;
  locationId: string;
  specificLocation?: string;
  lostAt: string; // ISO 8601
  designatedSecurityOfficeId: string;
}

export interface UpdateLostReportRequest {
  title?: string;
  description?: string;
  distinctiveFeatures?: string;
  categoryId?: string;
  locationId?: string;
  specificLocation?: string;
  lostAt?: string;
}

export interface CancelLostReportRequest {
  cancellationReason?: string;
}

export interface ResolveLostReportRequest {
  resolutionNotes?: string;
}
