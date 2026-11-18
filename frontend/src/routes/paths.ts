/**
 * Centralized Route Path Constants for CampusFind.
 */

export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    UNAUTHORIZED: '/unauthorized',
  },
  APP: {
    DASHBOARD: '/dashboard',
    FOUND_ITEMS: '/found-items',
    FOUND_ITEM_DETAIL: '/found-items/:id',
    LOST_REPORTS: '/lost-reports',
    LOST_REPORT_DETAIL: '/lost-reports/:id',
    CLAIMS: '/claims',
    CLAIM_DETAIL: '/claims/:id',
    NOTIFICATIONS: '/notifications',
    PROFILE: '/profile',
  },
  OFFICER: {
    ROOT: '/officer',
    DASHBOARD: '/officer/dashboard',
    HANDOVERS: '/officer/handovers',
    HANDOVER_DETAIL: '/officer/handovers/:itemId',
    FOUND_ITEMS: '/officer/found-items',
    LOST_REPORTS: '/officer/lost-reports',
    LOST_REPORT_DETAIL: '/officer/lost-reports/:reportId',
    CLAIMS: '/officer/claims',
    CLAIM_DETAIL: '/officer/claims/:claimId',
    COLLECTIONS: '/officer/collections',
    COLLECTION_DETAIL: '/officer/collections/:claimId',
    RETURNED_ITEMS: '/officer/returned-items',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    REPUTATION_RULES: '/admin/reputation-rules',
    AUDIT_LOGS: '/admin/audit-logs',
    SYSTEM_CONFIG: '/admin/system-config',
  },
} as const;
