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
    CLAIMS: '/claims',
    NOTIFICATIONS: '/notifications',
    PROFILE: '/profile',
  },
  OFFICER: {
    ROOT: '/officer',
    DASHBOARD: '/officer/dashboard',
    FOUND_ITEMS: '/officer/found-items',
    CLAIMS: '/officer/claims',
    HANDOVERS: '/officer/handovers',
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
