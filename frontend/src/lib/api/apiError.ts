import type { BackendErrorResponse, ValidationErrorItem } from '@/types/api';

export class ApiError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly path?: string;
  public readonly validationErrors?: ValidationErrorItem[];
  public readonly timestamp?: string;
  public readonly isNetworkError: boolean;

  constructor(params: {
    message: string;
    status: number;
    error: string;
    path?: string;
    validationErrors?: ValidationErrorItem[];
    timestamp?: string;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.error = params.error;
    this.path = params.path;
    this.validationErrors = params.validationErrors;
    this.timestamp = params.timestamp;
    this.isNetworkError = params.isNetworkError ?? false;

    // Ensure correct prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromBackendResponse(data: BackendErrorResponse, status: number): ApiError {
    return new ApiError({
      message: data.message || 'An unexpected server error occurred',
      status: data.status || status,
      error: data.error || 'Server Error',
      path: data.path,
      validationErrors: data.validationErrors,
      timestamp: data.timestamp,
    });
  }

  static networkError(message = 'Network error: unable to reach CampusFind server'): ApiError {
    return new ApiError({
      message,
      status: 0,
      error: 'Network Error',
      isNetworkError: true,
    });
  }

  static unknown(message = 'An unknown error occurred'): ApiError {
    return new ApiError({
      message,
      status: 500,
      error: 'Unknown Error',
    });
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function getFieldValidationError(error: unknown, field: string): string | undefined {
  if (isApiError(error) && error.validationErrors) {
    const found = error.validationErrors.find((v) => v.field === field);
    return found ? found.message : undefined;
  }
  return undefined;
}
