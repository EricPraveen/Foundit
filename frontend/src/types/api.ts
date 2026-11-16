/**
 * API types and error contracts matching backend Spring Boot ErrorResponse and Page DTOs.
 */

export interface ValidationErrorItem {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface BackendErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: ValidationErrorItem[];
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements?: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}
