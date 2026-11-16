import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ROUTES } from '../paths';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export interface PublicOnlyRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for routes that should only be accessible to non-authenticated visitors
 * (e.g. login, registration). Authenticated users are redirected to their role-appropriate dashboard.
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingIndicator size="lg" message="Loading..." />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (user.role === 'SECURITY_OFFICER') {
      return <Navigate to={ROUTES.OFFICER.DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.APP.DASHBOARD} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PublicOnlyRoute;
