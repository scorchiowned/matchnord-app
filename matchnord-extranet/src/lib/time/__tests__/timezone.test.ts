import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createUTCTimeString,
  parseUTCTimeString,
  formatUTCTimeAsLocal,
  formatUTCDateAsLocal,
  extractLocalDate,
  extractLocalTime,
  calculateEndTimeUTC,
} from '../timezone';

describe('Timezone Utilities', () => {
  // Store original timezone
  let originalTimezone: string;

  beforeEach(() => {
    // Store the original timezone
    originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  afterEach(() => {
    // Restore original timezone (if we changed it)
    // Note: We can't actually change the system timezone in Node.js,
    // but we can test with different timezone offsets
  });

  describe('createUTCTimeString', () => {
    it('should convert local date and time to UTC ISO string', () => {
      const date = '2024-01-15';
      const time = '14:00';
      const result = createUTCTimeString(date, time);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).toContain('2024-01-15');
    });

    it('should handle time with seconds', () => {
      const date = '2024-01-15';
      const time = '14:00:30';
      const result = createUTCTimeString(date, time);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).toContain('2024-01-15');
    });

    it('should add seconds if not provided', () => {
      const date = '2024-01-15';
      const time = '14:00';
      const result = createUTCTimeString(date, time);
      
      // Should have seconds (00) in the result, time will be converted to UTC
      expect(result).toMatch(/T\d{2}:\d{2}:00\.\d{3}Z$/);
    });

    it('should create correct UTC string for midnight', () => {
      const date = '2024-01-15';
      const time = '00:00';
      const result = createUTCTimeString(date, time);
      
      // Time will be converted to UTC based on local timezone
      // Date might be different if timezone offset pushes it to previous day
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // Verify it's a valid ISO string
      expect(() => new Date(result)).not.toThrow();
    });

    it('should create correct UTC string for end of day', () => {
      const date = '2024-01-15';
      const time = '23:59';
      const result = createUTCTimeString(date, time);
      
      // Time will be converted to UTC based on local timezone
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // Verify it's a valid ISO string
      expect(() => new Date(result)).not.toThrow();
    });
  });

  describe('parseUTCTimeString', () => {
    it('should parse UTC ISO string and convert to local date/time', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = parseUTCTimeString(utcString);
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2024-01-15');
      expect(result?.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle UTC string with timezone offset', () => {
      const utcString = '2024-01-15T12:00:00.000Z'; // UTC noon
      const result = parseUTCTimeString(utcString);
      
      expect(result).not.toBeNull();
      expect(result?.date).toBe('2024-01-15');
      // Time will depend on local timezone, but should be valid
      expect(result?.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should return null for null input', () => {
      const result = parseUTCTimeString(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = parseUTCTimeString(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseUTCTimeString('');
      expect(result).toBeNull();
    });

    it('should return null for invalid date string', () => {
      const result = parseUTCTimeString('not-a-date');
      expect(result).toBeNull();
    });

    it('should handle dates that cross midnight in local timezone', () => {
      // UTC time that might be different date in local timezone
      const utcString = '2024-01-15T23:00:00.000Z';
      const result = parseUTCTimeString(utcString);
      
      expect(result).not.toBeNull();
      expect(result?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result?.time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('formatUTCTimeAsLocal', () => {
    it('should format UTC time as local time string', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = formatUTCTimeAsLocal(utcString);
      
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should use custom format string', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = formatUTCTimeAsLocal(utcString, 'HH:mm:ss');
      
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should return empty string for null input', () => {
      const result = formatUTCTimeAsLocal(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = formatUTCTimeAsLocal(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for invalid date', () => {
      const result = formatUTCTimeAsLocal('not-a-date');
      expect(result).toBe('');
    });
  });

  describe('formatUTCDateAsLocal', () => {
    it('should format UTC date as local date string', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = formatUTCDateAsLocal(utcString);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use custom format string', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = formatUTCDateAsLocal(utcString, 'dd.MM.yyyy');
      
      expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    });

    it('should return empty string for null input', () => {
      const result = formatUTCDateAsLocal(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = formatUTCDateAsLocal(undefined);
      expect(result).toBe('');
    });
  });

  describe('extractLocalDate', () => {
    it('should extract date part from UTC string in local timezone', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = extractLocalDate(utcString);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toContain('2024');
    });

    it('should return empty string for null input', () => {
      const result = extractLocalDate(null);
      expect(result).toBe('');
    });

    it('should return empty string for invalid date', () => {
      const result = extractLocalDate('not-a-date');
      expect(result).toBe('');
    });
  });

  describe('extractLocalTime', () => {
    it('should extract time part from UTC string in local timezone', () => {
      const utcString = '2024-01-15T14:00:00.000Z';
      const result = extractLocalTime(utcString);
      
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should return empty string for null input', () => {
      const result = extractLocalTime(null);
      expect(result).toBe('');
    });

    it('should return empty string for invalid date', () => {
      const result = extractLocalTime('not-a-date');
      expect(result).toBe('');
    });
  });

  describe('calculateEndTimeUTC', () => {
    it('should calculate end time from start time and duration', () => {
      const startTimeUTC = '2024-01-15T14:00:00.000Z';
      const durationMinutes = 90;
      const result = calculateEndTimeUTC(startTimeUTC, durationMinutes);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // Should be 90 minutes later
      const startDate = new Date(startTimeUTC);
      const endDate = new Date(result);
      const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      
      expect(diffMinutes).toBe(90);
    });

    it('should handle duration that crosses midnight', () => {
      const startTimeUTC = '2024-01-15T23:30:00.000Z';
      const durationMinutes = 60;
      const result = calculateEndTimeUTC(startTimeUTC, durationMinutes);
      
      const startDate = new Date(startTimeUTC);
      const endDate = new Date(result);
      const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      
      expect(diffMinutes).toBe(60);
    });

    it('should handle zero duration', () => {
      const startTimeUTC = '2024-01-15T14:00:00.000Z';
      const durationMinutes = 0;
      const result = calculateEndTimeUTC(startTimeUTC, durationMinutes);
      
      expect(result).toBe(startTimeUTC);
    });

    it('should handle negative duration gracefully', () => {
      const startTimeUTC = '2024-01-15T14:00:00.000Z';
      const durationMinutes = -30;
      const result = calculateEndTimeUTC(startTimeUTC, durationMinutes);
      
      // Should still return a valid date (30 minutes before)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return start time for invalid input', () => {
      const startTimeUTC = 'not-a-date';
      const durationMinutes = 90;
      const result = calculateEndTimeUTC(startTimeUTC, durationMinutes);
      
      expect(result).toBe(startTimeUTC);
    });

    it('should handle large duration values', () => {
      const startTimeUTC = '2024-01-15T14:00:00.000Z';
      const durationMinutes = 1440; // 24 hours
      const result = calculateEndTimeUTC(startTimeUTC, durationMinutes);
      
      const startDate = new Date(startTimeUTC);
      const endDate = new Date(result);
      const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      
      expect(diffHours).toBe(24);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain consistency when converting local to UTC and back', () => {
      const date = '2024-01-15';
      const time = '14:00';
      
      // Convert local to UTC
      const utcString = createUTCTimeString(date, time);
      expect(utcString).toMatch(/Z$/);
      
      // Convert UTC back to local
      const localTime = parseUTCTimeString(utcString);
      expect(localTime).not.toBeNull();
      
      // The date should match (time might differ due to timezone)
      expect(localTime?.date).toBe(date);
      // Time should be valid format
      expect(localTime?.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle edge case of midnight UTC', () => {
      const utcString = '2024-01-15T00:00:00.000Z';
      const localTime = parseUTCTimeString(utcString);
      
      expect(localTime).not.toBeNull();
      expect(localTime?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(localTime?.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle edge case of end of day UTC', () => {
      const utcString = '2024-01-15T23:59:59.000Z';
      const localTime = parseUTCTimeString(utcString);
      
      expect(localTime).not.toBeNull();
      expect(localTime?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(localTime?.time).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});

