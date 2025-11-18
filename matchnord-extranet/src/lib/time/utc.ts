/**
 * UTC Time Utilities for Server-Side
 * 
 * All times should be stored and processed in UTC on the server.
 * This module provides utilities to ensure consistent UTC handling.
 */

/**
 * Parse a time string as UTC, ensuring it's treated as UTC regardless of format
 * 
 * @param timeString - ISO string (with or without timezone indicator)
 * @returns Date object representing the time in UTC
 * 
 * @example
 * parseUTCTime("2024-01-15T14:00:00") // Assumes UTC
 * parseUTCTime("2024-01-15T14:00:00Z") // Explicitly UTC
 * parseUTCTime("2024-01-15T14:00:00+02:00") // Converts to UTC
 */
export function parseUTCTime(timeString: string | null | undefined): Date | undefined {
  if (!timeString) {
    return undefined;
  }

  // If already has timezone indicator, parse directly
  if (timeString.includes('Z') || timeString.includes('+') || timeString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(timeString);
  }

  // If no timezone indicator, assume UTC and add 'Z'
  // Handle both "YYYY-MM-DDTHH:mm:ss" and "YYYY-MM-DD HH:mm:ss" formats
  const normalizedString = timeString.replace(' ', 'T');
  const utcString = normalizedString.endsWith('Z') 
    ? normalizedString 
    : normalizedString + 'Z';
  
  return new Date(utcString);
}

/**
 * Format a Date object as UTC ISO string
 * 
 * @param date - Date object (should already be in UTC)
 * @returns ISO string with 'Z' suffix indicating UTC
 * 
 * @example
 * formatAsUTC(new Date()) // "2024-01-15T14:00:00.000Z"
 */
export function formatAsUTC(date: Date | null | undefined): string | undefined {
  if (!date) {
    return undefined;
  }

  return date.toISOString();
}

/**
 * Validate that a time string is in a valid format
 * 
 * @param timeString - Time string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimeString(timeString: string | null | undefined): boolean {
  if (!timeString) {
    return false;
  }

  // Check for ISO format (with or without timezone)
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
  return isoPattern.test(timeString);
}

/**
 * Ensure a time string is in UTC format (adds 'Z' if missing)
 * 
 * @param timeString - Time string to normalize
 * @returns UTC-formatted string
 */
export function ensureUTCFormat(timeString: string): string {
  if (timeString.includes('Z') || timeString.match(/[+-]\d{2}:\d{2}$/)) {
    return timeString;
  }

  // Normalize space to 'T' if needed
  const normalized = timeString.replace(' ', 'T');
  return normalized + 'Z';
}

