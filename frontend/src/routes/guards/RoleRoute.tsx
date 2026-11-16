import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import type { UserRole } from '@/types/auth';
import { ROUTES } from '../paths';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export interface RoleRouteProps {
  allowedRoles: UserRole | UserRole[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingIndicator size="lg" message="Verifying access permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ from: location }} replace />;
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to={ROUTES.PUBLIC.UNAUTHORIZED} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
