import { apiClient } from '@/lib/api';
import type {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResendVerificationRequest,
  User,
} from '@/types/auth';
import { normalizeEmail } from '../utils/validation';

export const authService = {
  /**
   * Registers a new student account using official @uom.lk email.
   * Endpoint: POST /api/v1/auth/register
   */
  async register(data: RegisterRequest): Promise<MessageResponse> {
    const payload: RegisterRequest = {
      email: normalizeEmail(data.email),
      password: data.password,
      fullName: data.fullName.trim(),
    };
    return apiClient.post<MessageResponse>('/auth/register', payload);
  },

  /**
   * Authenticates user credentials and retrieves JWT access token and user identity.
   * Endpoint: POST /api/v1/auth/login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const payload: LoginRequest = {
      email: normalizeEmail(data.email),
      password: data.password,
    };
    return apiClient.post<AuthResponse>('/auth/login', payload);
  },

  /**
   * Validates single-use expiring email verification token.
   * Endpoint: GET /api/v1/auth/verify-email?token={token}
   */
  async verifyEmail(token: string): Promise<MessageResponse> {
    return apiClient.get<MessageResponse>(`/auth/verify-email?token=${encodeURIComponent(token.trim())}`);
  },

  /**
   * Requests a fresh verification link sent to an unverified @uom.lk email.
   * Endpoint: POST /api/v1/auth/resend-verification
   */
  async resendVerification(email: string): Promise<MessageResponse> {
    const payload: ResendVerificationRequest = {
      email: normalizeEmail(email),
    };
    return apiClient.post<MessageResponse>('/auth/resend-verification', payload);
  },

  /**
   * Retrieves authenticated profile using the stored Bearer token.
   * Endpoint: GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },
};
