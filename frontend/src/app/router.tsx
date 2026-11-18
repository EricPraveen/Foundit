import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { RoleRoute } from '@/routes/guards/RoleRoute';
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

// Lazy-loaded pages
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/pages/public/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'));
const UnauthorizedPage = lazy(() => import('@/pages/public/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

// Student App Pages
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const FoundItemsPage = lazy(() => import('@/pages/app/FoundItemsPage'));
const FoundItemDetailPage = lazy(() => import('@/pages/app/FoundItemDetailPage'));
const LostReportsPage = lazy(() => import('@/pages/app/LostReportsPage'));
const LostReportDetailPage = lazy(() => import('@/pages/app/LostReportDetailPage'));
const ClaimsPage = lazy(() => import('@/pages/app/ClaimsPage'));
const ClaimDetailPage = lazy(() => import('@/pages/app/ClaimDetailPage'));
const NotificationsPage = lazy(() => import('@/pages/app/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'));

// Officer Pages
const OfficerDashboardPage = lazy(() => import('@/pages/officer/OfficerDashboardPage'));
const OfficerHandoversPage = lazy(() => import('@/pages/officer/OfficerHandoversPage'));
const OfficerHandoverDetailPage = lazy(() => import('@/pages/officer/OfficerHandoverDetailPage'));
const OfficerFoundItemsPage = lazy(() => import('@/pages/officer/OfficerFoundItemsPage'));
const OfficerLostReportsPage = lazy(() => import('@/pages/officer/OfficerLostReportsPage'));
const OfficerLostReportDetailPage = lazy(() => import('@/pages/officer/OfficerLostReportDetailPage'));
const OfficerClaimsPage = lazy(() => import('@/pages/officer/OfficerClaimsPage'));
const OfficerClaimDetailPage = lazy(() => import('@/pages/officer/OfficerClaimDetailPage'));
const OfficerCollectionsPage = lazy(() => import('@/pages/officer/OfficerCollectionsPage'));
const OfficerCollectionDetailPage = lazy(() => import('@/pages/officer/OfficerCollectionDetailPage'));
const OfficerReturnedItemsPage = lazy(() => import('@/pages/officer/OfficerReturnedItemsPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@/pages/admin/AdminUserDetailPage'));
const AdminOfficersPage = lazy(() => import('@/pages/admin/AdminOfficersPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminLocationsPage = lazy(() => import('@/pages/admin/AdminLocationsPage'));
const AdminReputationRulesPage = lazy(() => import('@/pages/admin/AdminReputationRulesPage'));
const AdminSystemConfigPage = lazy(() => import('@/pages/admin/AdminSystemConfigPage'));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'));
const AdminAuditLogDetailPage = lazy(() => import('@/pages/admin/AdminAuditLogDetailPage'));

const pageFallback = (
  <div className="flex h-96 w-full items-center justify-center">
    <LoadingIndicator size="lg" message="Loading..." />
  </div>
);

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={pageFallback}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  // Public Routes
  {
    element: <PublicLayout />,
    children: [
      {
        path: ROUTES.PUBLIC.HOME,
        element: withSuspense(HomePage),
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: ROUTES.PUBLIC.LOGIN,
            element: withSuspense(LoginPage),
          },
          {
            path: ROUTES.PUBLIC.REGISTER,
            element: withSuspense(RegisterPage),
          },
        ],
      },
      {
        path: ROUTES.PUBLIC.VERIFY_EMAIL,
        element: withSuspense(VerifyEmailPage),
      },
      {
        path: ROUTES.PUBLIC.FORGOT_PASSWORD,
        element: withSuspense(ForgotPasswordPage),
      },
      {
        path: ROUTES.PUBLIC.UNAUTHORIZED,
        element: withSuspense(UnauthorizedPage),
      },
      {
        path: '*',
        element: withSuspense(NotFoundPage),
      },
    ],
  },

  // Authenticated Application Routes (Student & general)
  {
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.APP.DASHBOARD,
        element: withSuspense(DashboardPage),
      },
      {
        path: ROUTES.APP.FOUND_ITEMS,
        element: withSuspense(FoundItemsPage),
      },
      {
        path: ROUTES.APP.FOUND_ITEM_DETAIL,
        element: withSuspense(FoundItemDetailPage),
      },
      {
        path: ROUTES.APP.LOST_REPORTS,
        element: withSuspense(LostReportsPage),
      },
      {
        path: ROUTES.APP.LOST_REPORT_DETAIL,
        element: withSuspense(LostReportDetailPage),
      },
      {
        path: ROUTES.APP.CLAIMS,
        element: withSuspense(ClaimsPage),
      },
      {
        path: ROUTES.APP.CLAIM_DETAIL,
        element: withSuspense(ClaimDetailPage),
      },
      {
        path: ROUTES.APP.NOTIFICATIONS,
        element: withSuspense(NotificationsPage),
      },
      {
        path: ROUTES.APP.PROFILE,
        element: withSuspense(ProfilePage),
      },
    ],
  },

  // Security Officer Routes
  {
    path: ROUTES.OFFICER.ROOT,
    element: (
      <RoleRoute allowedRoles={['SECURITY_OFFICER']}>
        <AuthenticatedLayout />
      </RoleRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.OFFICER.DASHBOARD} replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(OfficerDashboardPage),
      },
      {
        path: 'handovers',
        element: withSuspense(OfficerHandoversPage),
      },
      {
        path: 'handovers/:itemId',
        element: withSuspense(OfficerHandoverDetailPage),
      },
      {
        path: 'found-items',
        element: withSuspense(OfficerFoundItemsPage),
      },
      {
        path: 'lost-reports',
        element: withSuspense(OfficerLostReportsPage),
      },
      {
        path: 'lost-reports/:reportId',
        element: withSuspense(OfficerLostReportDetailPage),
      },
      {
        path: 'claims',
        element: withSuspense(OfficerClaimsPage),
      },
      {
        path: 'claims/:claimId',
        element: withSuspense(OfficerClaimDetailPage),
      },
      {
        path: 'collections',
        element: withSuspense(OfficerCollectionsPage),
      },
      {
        path: 'collections/:claimId',
        element: withSuspense(OfficerCollectionDetailPage),
      },
      {
        path: 'returned-items',
        element: withSuspense(OfficerReturnedItemsPage),
      },
    ],
  },

  // Super Admin Routes
  {
    path: ROUTES.ADMIN.ROOT,
    element: (
      <RoleRoute allowedRoles={['SUPER_ADMIN']}>
        <AuthenticatedLayout />
      </RoleRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(AdminDashboardPage),
      },
      {
        path: 'users',
        element: withSuspense(AdminUsersPage),
      },
      {
        path: 'users/:userId',
        element: withSuspense(AdminUserDetailPage),
      },
      {
        path: 'officers',
        element: withSuspense(AdminOfficersPage),
      },
      {
        path: 'categories',
        element: withSuspense(AdminCategoriesPage),
      },
      {
        path: 'locations',
        element: withSuspense(AdminLocationsPage),
      },
      {
        path: 'reputation-rules',
        element: withSuspense(AdminReputationRulesPage),
      },
      {
        path: 'unclaimed-policy',
        element: withSuspense(AdminSystemConfigPage),
      },
      {
        path: 'system-config',
        element: withSuspense(AdminSystemConfigPage),
      },
      {
        path: 'audit-logs',
        element: withSuspense(AdminAuditLogsPage),
      },
      {
        path: 'audit-logs/:auditId',
        element: withSuspense(AdminAuditLogDetailPage),
      },
    ],
  },
]);
