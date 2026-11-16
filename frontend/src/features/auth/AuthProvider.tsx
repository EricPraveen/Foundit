import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthResponse, User, UserRole } from '@/types/auth';
import { registerUnauthorizedHandler } from '@/lib/api/apiClient';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { AuthContext, type AuthContextValue } from './AuthContext';

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialToken?: string | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialUser = null,
  initialToken,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    if (initialToken !== undefined) return initialToken;
    return tokenStorage.getAccessToken();
  });

  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    tokenStorage.clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((authResponse: AuthResponse) => {
    tokenStorage.setAccessToken(authResponse.accessToken);
    setToken(authResponse.accessToken);
    setUser(authResponse.user);
  }, []);

  // Listen for 401 unauthorized errors from the API client
  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      logout();
    });
    return unregister;
  }, [logout]);

  const hasRole = useCallback(
    (allowedRoles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token && user),
      isLoading,
      user,
      token,
      login,
      logout,
      hasRole,
      setIsLoading,
    }),
    [token, user, isLoading, login, logout, hasRole, setIsLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
