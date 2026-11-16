import { createContext } from 'react';
import type { AuthResponse, AuthState, User, UserRole } from '@/types/auth';

export interface AuthContextValue extends AuthState {
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole | UserRole[]) => boolean;
  setIsLoading: (loading: boolean) => void;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
