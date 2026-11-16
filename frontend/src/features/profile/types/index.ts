import { UserRole } from '@/types/auth';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

/**
 * Backend response DTO from GET /api/v1/users/me and PUT /api/v1/users/me.
 * Note: indexNumber and indexNumberVerified exist in the backend DTO but MUST NEVER be displayed
 * in the student UI per strict privacy and institutional security requirements.
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  indexNumber?: string;
  phoneNumber?: string | null;
  indexNumberVerified?: boolean;
  createdAt: string;
}

/**
 * Backend request DTO for PUT /api/v1/users/me.
 */
export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  indexNumber?: string | null;
}
