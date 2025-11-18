/**
 * Timezone Utilities for Client-Side
 * 
 * Handles conversion between local timezone (for display) and UTC (for server communication).
 * All times sent to server should be in UTC, all times received from server should be
 * converted to local timezone for display.
 */

import { format, parseISO } from 'date-fns';

/**
 * Convert a local date and time string to UTC ISO string
 * 
 * @param date - Date string in format "YYYY-MM-DD"
 * @param time - Time string in format "HH:mm" or "HH:mm:ss"
 * @returns UTC ISO string (e.g., "2024-01-15T14:00:00.000Z")
 * 
 * @example
 * createUTCTimeString("2024-01-15", "14:00") // Returns UTC ISO string
 */
export function createUTCTimeString(date: string, time: string): string {
  // Combine date and time, treating as local time
  const timeWithSeconds = time.includes(':') && time.split(':').length === 2 
    ? `${time}:00` 
    : time;
  const localDateTime = `${date}T${timeWithSeconds}`;
  
  // Create Date object (will be interpreted as local time)
  const localDate = new Date(localDateTime);
  
  // Return ISO string (automatically converts to UTC)
  return localDate.toISOString();
}

/**
 * Parse a UTC ISO string and extract local date and time components
 * 
 * @param utcString - UTC ISO string (e.g., "2024-01-15T14:00:00.000Z")
 * @returns Object with date and time strings in local timezone
 * 
 * @example
 * parseUTCTimeString("2024-01-15T12:00:00.000Z") 
 * // Returns { date: "2024-01-15", time: "14:00" } (if in UTC+2 timezone)
 */
export function parseUTCTimeString(utcString: string | null | undefined): { date: string; time: string } | null {
  if (!utcString) {
    return null;
  }

  try {
    // Parse UTC string (parseISO handles UTC correctly)
    const date = parseISO(utcString);
    
    // Format in local timezone
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = format(date, 'HH:mm');
    
    return { date: dateStr, time: timeStr };
  } catch (error) {
    console.error('Error parsing UTC time string:', error);
    return null;
  }
}

/**
 * Convert UTC ISO string to local time string for display
 * 
 * @param utcString - UTC ISO string
 * @param formatStr - Format string (default: "HH:mm")
 * @returns Formatted time string in local timezone
 */
export function formatUTCTimeAsLocal(utcString: string | null | undefined, formatStr: string = 'HH:mm'): string {
  if (!utcString) {
    return '';
  }

  try {
    const date = parseISO(utcString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting UTC time:', error);
    return '';
  }
}

/**
 * Convert UTC ISO string to local date string for display
 * 
 * @param utcString - UTC ISO string
 * @param formatStr - Format string (default: "yyyy-MM-dd")
 * @returns Formatted date string in local timezone
 */
export function formatUTCDateAsLocal(utcString: string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string {
  if (!utcString) {
    return '';
  }

  try {
    const date = parseISO(utcString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting UTC date:', error);
    return '';
  }
}

/**
 * Extract date part from UTC ISO string (in local timezone)
 * 
 * @param utcString - UTC ISO string
 * @returns Date string in format "YYYY-MM-DD"
 */
export function extractLocalDate(utcString: string | null | undefined): string {
  if (!utcString) {
    return '';
  }

  try {
    const date = parseISO(utcString);
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error extracting date:', error);
    return '';
  }
}

/**
 * Extract time part from UTC ISO string (in local timezone)
 * 
 * @param utcString - UTC ISO string
 * @returns Time string in format "HH:mm"
 */
export function extractLocalTime(utcString: string | null | undefined): string {
  if (!utcString) {
    return '';
  }

  try {
    const date = parseISO(utcString);
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error extracting time:', error);
    return '';
  }
}

/**
 * Calculate end time from start time and duration (in minutes)
 * Returns UTC ISO string
 * 
 * @param startTimeUTC - Start time as UTC ISO string
 * @param durationMinutes - Duration in minutes
 * @returns End time as UTC ISO string
 */
export function calculateEndTimeUTC(startTimeUTC: string, durationMinutes: number): string {
  try {
    const startDate = parseISO(startTimeUTC);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    return endDate.toISOString();
  } catch (error) {
    console.error('Error calculating end time:', error);
    return startTimeUTC;
  }
}

