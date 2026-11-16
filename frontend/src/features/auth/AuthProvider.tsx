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
import { authService } from './services/authService';

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
  // If we have a token stored in localStorage but no initialUser, we are in initial rehydration
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (initialUser !== null) return false;
    const storedToken = initialToken !== undefined ? initialToken : tokenStorage.getAccessToken();
    return Boolean(storedToken);
  });

  const logout = useCallback(() => {
    tokenStorage.clearAccessToken();
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const login = useCallback((authResponse: AuthResponse) => {
    tokenStorage.setAccessToken(authResponse.accessToken);
    setToken(authResponse.accessToken);
    setUser(authResponse.user);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentToken = tokenStorage.getAccessToken();
    if (!currentToken) {
      logout();
      return null;
    }
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  // Listen for 401 unauthorized errors from the API client
  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      logout();
    });
    return unregister;
  }, [logout]);

  // Rehydrate user profile if token is present on startup
  useEffect(() => {
    let mounted = true;

    if (token && !user) {
      authService
        .getCurrentUser()
        .then((fetchedUser) => {
          if (mounted) {
            setUser(fetchedUser);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            logout();
          }
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [token, user, logout]);

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
      refreshUser,
    }),
    [token, user, isLoading, login, logout, hasRole, setIsLoading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
