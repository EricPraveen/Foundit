import { describe, it, expect } from 'vitest';
import {
  ApiError,
  isApiError,
  getErrorMessage,
  getFieldValidationError,
} from '@/lib/api/apiError';
import type { BackendErrorResponse } from '@/types/api';

describe('ApiError utility', () => {
  it('correctly maps backend error responses into an ApiError instance', () => {
    const backendPayload: BackendErrorResponse = {
      timestamp: '2026-11-16T10:00:00Z',
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed for field email',
      path: '/api/v1/auth/register',
      validationErrors: [
        {
          field: 'email',
          message: 'Email must end with @uom.lk',
          rejectedValue: 'user@gmail.com',
        },
      ],
    };

    const error = ApiError.fromBackendResponse(backendPayload, 400);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(400);
    expect(error.error).toBe('Bad Request');
    expect(error.message).toBe('Validation failed for field email');
    expect(error.path).toBe('/api/v1/auth/register');
    expect(error.validationErrors).toHaveLength(1);
    expect(error.validationErrors?.[0].field).toBe('email');
    expect(isApiError(error)).toBe(true);
  });

  it('creates network error correctly', () => {
    const netErr = ApiError.networkError('Failed to fetch');
    expect(netErr.isNetworkError).toBe(true);
    expect(netErr.status).toBe(0);
    expect(netErr.message).toBe('Failed to fetch');
  });

  it('extracts error messages reliably with getErrorMessage', () => {
    const apiErr = new ApiError({
      message: 'Resource not found',
      status: 404,
      error: 'Not Found',
    });
    const standardErr = new Error('Standard failure');

    expect(getErrorMessage(apiErr)).toBe('Resource not found');
    expect(getErrorMessage(standardErr)).toBe('Standard failure');
    expect(getErrorMessage('some string', 'Fallback')).toBe('Fallback');
  });

  it('extracts specific field validation errors', () => {
    const errorWithFields = new ApiError({
      message: 'Validation error',
      status: 400,
      error: 'Bad Request',
      validationErrors: [
        { field: 'email', message: 'Invalid university domain' },
        { field: 'password', message: 'Password is too short' },
      ],
    });

    expect(getFieldValidationError(errorWithFields, 'email')).toBe('Invalid university domain');
    expect(getFieldValidationError(errorWithFields, 'password')).toBe('Password is too short');
    expect(getFieldValidationError(errorWithFields, 'fullName')).toBeUndefined();
  });
});
