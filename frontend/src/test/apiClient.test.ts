import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import {
  apiClient,
  axiosInstance,
  registerUnauthorizedHandler,
  API_BASE_URL,
} from '@/lib/api/apiClient';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { ApiError } from '@/lib/api/apiError';

describe('apiClient', () => {
  const originalAdapter = axiosInstance.defaults.adapter;

  beforeEach(() => {
    tokenStorage.clearAccessToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('exposes the configured base URL', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(API_BASE_URL).toContain('/api/v1');
  });

  it('automatically adds Authorization header when token exists', async () => {
    tokenStorage.setAccessToken('test-bearer-token');

    let interceptedHeaders: Record<string, string | number | boolean> | undefined;

    axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      interceptedHeaders = config.headers as unknown as Record<string, string | number | boolean>;
      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    };

    const res = await apiClient.get<{ success: boolean }>('/test-endpoint');
    expect(res).toEqual({ success: true });
    expect(interceptedHeaders?.Authorization).toBe('Bearer test-bearer-token');
  });

  it('supports multipart/form-data upload method and forwards FormData', async () => {
    const formData = new FormData();
    formData.append('key', 'value');

    let capturedData: unknown;

    axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      capturedData = config.data;
      return {
        data: { uploaded: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    };

    const res = await apiClient.upload<{ uploaded: boolean }>('/upload', formData);
    expect(res).toEqual({ uploaded: true });
    expect(capturedData).toBe(formData);
  });

  it('invokes unauthorized handler and maps 401 to ApiError on 401 response', async () => {
    const onUnauthorized = vi.fn();
    const unregister = registerUnauthorizedHandler(onUnauthorized);

    axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const error = new axios.AxiosError(
        'Request failed with status code 401',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            timestamp: '2026-11-16T10:00:00Z',
            status: 401,
            error: 'Unauthorized',
            message: 'Full authentication is required to access this resource',
            path: '/api/v1/auth/me',
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        }
      );
      throw error;
    };

    await expect(apiClient.get('/api/v1/auth/me')).rejects.toThrow(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    unregister();
  });

  it('supports HTTP methods get, post, put, patch, delete', async () => {
    axiosInstance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      return {
        data: { method: config.method, url: config.url },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    };

    const getRes = await apiClient.get<{ method: string }>('/resource');
    expect(getRes.method).toBe('get');

    const postRes = await apiClient.post<{ method: string }>('/resource', { name: 'item' });
    expect(postRes.method).toBe('post');

    const putRes = await apiClient.put<{ method: string }>('/resource', { name: 'item' });
    expect(putRes.method).toBe('put');

    const patchRes = await apiClient.patch<{ method: string }>('/resource', { name: 'item' });
    expect(patchRes.method).toBe('patch');

    const delRes = await apiClient.delete<{ method: string }>('/resource');
    expect(delRes.method).toBe('delete');
  });
});
