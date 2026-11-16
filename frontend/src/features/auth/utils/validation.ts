/**
 * Institutional email and authentication form validation matching backend AuthService rules.
 */

export const UOM_DOMAIN = 'uom.lk';

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Validates whether an email conforms strictly to the official university domain (@uom.lk).
 * Rejects subdomains (e.g. @student.uom.lk) and lookalikes (e.g. @uom.lk.com).
 */
export function isValidUomEmail(email: string): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0 || atIndex !== normalized.lastIndexOf('@')) {
    return false;
  }
  const localPart = normalized.substring(0, atIndex);
  const domain = normalized.substring(atIndex + 1);

  if (domain !== UOM_DOMAIN) {
    return false;
  }

  // Matches local part: alphanumeric and allowed email symbols
  return /^[a-zA-Z0-9._%+-]+$/.test(localPart);
}
