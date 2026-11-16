/**
 * Core authentication and user types for CampusFind.
 * Strictly aligned with backend contracts in domain.auth.UserRole and features.auth.dto.*
 */

export type UserRole = 'STUDENT' | 'SECURITY_OFFICER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}
