import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError } from './apiError';
import { tokenStorage } from './tokenStorage';
import type { BackendErrorResponse } from '@/types/api';

const DEFAULT_BASE_URL = 'http://localhost:8080/api/v1';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') || DEFAULT_BASE_URL;

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

/**
 * Creates and configures the core Axios client.
 */
function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request Interceptor: Attach JWT Bearer token if present
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // If data is FormData, let the browser / axios automatically set multipart/form-data with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Normalize responses and map errors to ApiError
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<BackendErrorResponse>) => {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as BackendErrorResponse | undefined;

        if (status === 401 && unauthorizedHandler) {
          unauthorizedHandler();
        }

        const fallbackMessage = `Request failed with status ${status}`;
        const errorMessage = data?.message || error.message || fallbackMessage;

        const apiError = data
          ? ApiError.fromBackendResponse(data, status)
          : new ApiError({
              timestamp: new Date().toISOString(),
              status,
              error: error.message || 'HTTP Error',
              message: errorMessage,
              path: error.config?.url || '',
            });
        return Promise.reject(apiError);
      }

      if (error.request) {
        return Promise.reject(ApiError.networkError(error.message));
      }

      return Promise.reject(ApiError.unknown(error.message));
    }
  );

  return instance;
}

export const axiosInstance = createApiClient();

/**
 * Clean, typed API client wrapper for application services.
 */
export const apiClient = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.get<T>(url, config).then((res) => res.data);
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.post<T>(url, data, config).then((res) => res.data);
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.put<T>(url, data, config).then((res) => res.data);
  },

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.patch<T>(url, data, config).then((res) => res.data);
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.delete<T>(url, config).then((res) => res.data);
  },

  /**
   * Helper for multipart/form-data uploads (e.g. found item photos, claim evidence)
   */
  upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance
      .post<T>(url, formData, {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data);
  },
};
