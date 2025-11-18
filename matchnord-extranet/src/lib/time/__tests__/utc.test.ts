import { describe, it, expect } from 'vitest';
import {
  parseUTCTime,
  formatAsUTC,
  isValidTimeString,
  ensureUTCFormat,
} from '../utc';

describe('UTC Utilities', () => {
  describe('parseUTCTime', () => {
    it('should parse ISO string with Z suffix as UTC', () => {
      const timeString = '2024-01-15T14:00:00Z';
      const result = parseUTCTime(timeString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T14:00:00.000Z');
    });

    it('should parse ISO string with timezone offset as UTC', () => {
      const timeString = '2024-01-15T14:00:00+02:00';
      const result = parseUTCTime(timeString);
      
      expect(result).toBeInstanceOf(Date);
      // Should convert +02:00 to UTC (subtract 2 hours)
      expect(result?.toISOString()).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should parse ISO string without timezone and add Z', () => {
      const timeString = '2024-01-15T14:00:00';
      const result = parseUTCTime(timeString);
      
      expect(result).toBeInstanceOf(Date);
      // Should treat as UTC
      expect(result?.toISOString()).toBe('2024-01-15T14:00:00.000Z');
    });

    it('should parse ISO string with space separator and add Z', () => {
      const timeString = '2024-01-15 14:00:00';
      const result = parseUTCTime(timeString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T14:00:00.000Z');
    });

    it('should return undefined for null input', () => {
      const result = parseUTCTime(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = parseUTCTime(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = parseUTCTime('');
      expect(result).toBeUndefined();
    });

    it('should handle ISO string with milliseconds', () => {
      const timeString = '2024-01-15T14:00:00.123Z';
      const result = parseUTCTime(timeString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T14:00:00.123Z');
    });
  });

  describe('formatAsUTC', () => {
    it('should format Date object as UTC ISO string', () => {
      const date = new Date('2024-01-15T14:00:00Z');
      const result = formatAsUTC(date);
      
      expect(result).toBe('2024-01-15T14:00:00.000Z');
    });

    it('should handle Date object created from local time', () => {
      // Create a date in local timezone
      const date = new Date(2024, 0, 15, 14, 0, 0); // Jan 15, 2024 14:00:00 local
      const result = formatAsUTC(date);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).toContain('2024-01-15');
    });

    it('should return undefined for null input', () => {
      const result = formatAsUTC(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = formatAsUTC(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('isValidTimeString', () => {
    it('should return true for valid ISO string with Z', () => {
      expect(isValidTimeString('2024-01-15T14:00:00Z')).toBe(true);
    });

    it('should return true for valid ISO string with timezone offset', () => {
      expect(isValidTimeString('2024-01-15T14:00:00+02:00')).toBe(true);
      expect(isValidTimeString('2024-01-15T14:00:00-05:00')).toBe(true);
    });

    it('should return true for valid ISO string without timezone', () => {
      expect(isValidTimeString('2024-01-15T14:00:00')).toBe(true);
    });

    it('should return true for ISO string with milliseconds', () => {
      expect(isValidTimeString('2024-01-15T14:00:00.123Z')).toBe(true);
    });

    it('should return false for invalid date string', () => {
      expect(isValidTimeString('not-a-date')).toBe(false);
      // Note: The regex only validates format, not actual date validity
      // So '2024-13-45T25:99:99' matches the format pattern but is not a valid date
      // For truly invalid format, use strings that don't match the pattern
      expect(isValidTimeString('2024-01-15')).toBe(false); // Missing time
      expect(isValidTimeString('14:00:00')).toBe(false); // Missing date
    });

    it('should return false for null input', () => {
      expect(isValidTimeString(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isValidTimeString(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidTimeString('')).toBe(false);
    });

    it('should return false for date without time', () => {
      expect(isValidTimeString('2024-01-15')).toBe(false);
    });
  });

  describe('ensureUTCFormat', () => {
    it('should return string unchanged if it already has Z suffix', () => {
      const input = '2024-01-15T14:00:00Z';
      const result = ensureUTCFormat(input);
      
      expect(result).toBe('2024-01-15T14:00:00Z');
    });

    it('should return string unchanged if it has timezone offset', () => {
      const input = '2024-01-15T14:00:00+02:00';
      const result = ensureUTCFormat(input);
      
      expect(result).toBe('2024-01-15T14:00:00+02:00');
    });

    it('should add Z suffix to string without timezone', () => {
      const input = '2024-01-15T14:00:00';
      const result = ensureUTCFormat(input);
      
      expect(result).toBe('2024-01-15T14:00:00Z');
    });

    it('should normalize space to T and add Z', () => {
      const input = '2024-01-15 14:00:00';
      const result = ensureUTCFormat(input);
      
      expect(result).toBe('2024-01-15T14:00:00Z');
    });

    it('should handle string with milliseconds', () => {
      const input = '2024-01-15T14:00:00.123';
      const result = ensureUTCFormat(input);
      
      expect(result).toBe('2024-01-15T14:00:00.123Z');
    });
  });
});

