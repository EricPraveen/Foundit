import { describe, it, expect } from 'vitest';
import { isValidUomEmail, normalizeEmail } from '@/features/auth/utils/validation';

describe('Authentication Validation Utilities', () => {
  describe('normalizeEmail', () => {
    it('trims whitespace and converts to lowercase', () => {
      expect(normalizeEmail('  Student@UOM.LK  ')).toBe('student@uom.lk');
      expect(normalizeEmail('Kasun.P@uom.lk')).toBe('kasun.p@uom.lk');
      expect(normalizeEmail('')).toBe('');
    });
  });

  describe('isValidUomEmail', () => {
    it('accepts exact @uom.lk email addresses', () => {
      expect(isValidUomEmail('student@uom.lk')).toBe(true);
      expect(isValidUomEmail('kasun.perera@uom.lk')).toBe(true);
      expect(isValidUomEmail('user_123@uom.lk')).toBe(true);
      expect(isValidUomEmail('TEST@UOM.LK')).toBe(true);
    });

    it('rejects external commercial and personal email providers', () => {
      expect(isValidUomEmail('student@gmail.com')).toBe(false);
      expect(isValidUomEmail('student@yahoo.com')).toBe(false);
      expect(isValidUomEmail('student@outlook.com')).toBe(false);
    });

    it('strictly rejects university subdomains', () => {
      expect(isValidUomEmail('student@cse.uom.lk')).toBe(false);
      expect(isValidUomEmail('student@dept.uom.lk')).toBe(false);
      expect(isValidUomEmail('student@student.uom.lk')).toBe(false);
    });

    it('strictly rejects lookalike and spoofing domains', () => {
      expect(isValidUomEmail('student@uom.lk.attacker.com')).toBe(false);
      expect(isValidUomEmail('student@fake-uom.lk')).toBe(false);
      expect(isValidUomEmail('student@uom.lk.co')).toBe(false);
      expect(isValidUomEmail('student@notuom.lk')).toBe(false);
    });

    it('rejects malformed email strings', () => {
      expect(isValidUomEmail('')).toBe(false);
      expect(isValidUomEmail('invalid')).toBe(false);
      expect(isValidUomEmail('@uom.lk')).toBe(false);
      expect(isValidUomEmail('student@@uom.lk')).toBe(false);
      expect(isValidUomEmail('student@uom.lk@extra.com')).toBe(false);
    });
  });
});
