/**
 * Utility functions for handling timestamps consistently across the application
 * Backend stores all timestamps in UTC, but we want to display in user's local time
 */

/**
 * Safely convert various timestamp formats to a consistent string format
 */
const normalizeTimestamp = (timestamp) => {
  console.log('🔍 normalizeTimestamp received:', timestamp, 'Type:', typeof timestamp, 'Constructor:', timestamp?.constructor?.name);

  // Handle null, undefined, or empty values
  if (!timestamp) {
    console.warn('normalizeTimestamp: received null/undefined timestamp');
    return new Date().toISOString();
  }

  // If it's already a Date object, convert to ISO string
  if (timestamp instanceof Date) {
    console.warn('normalizeTimestamp: received Date object', timestamp);
    return timestamp.toISOString();
  }

  // If it's a number (timestamp in milliseconds), convert to Date then ISO string
  if (typeof timestamp === 'number') {
    console.warn('normalizeTimestamp: received number', timestamp);
    return new Date(timestamp).toISOString();
  }

  // If it's a string, ensure it has timezone info
  if (typeof timestamp === 'string') {
    // Validate that it's actually a string with includes method
    if (typeof timestamp.includes === 'function') {
      return timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-')
        ? timestamp
        : timestamp + 'Z';
    } else {
      console.warn('normalizeTimestamp: string-like object without includes method', timestamp);
      return new Date().toISOString();
    }
  }

  // Handle React elements or other complex objects
  if (timestamp && typeof timestamp === 'object') {
    // Check if it's a React element (has $$typeof)
    if (timestamp.$$typeof) {
      console.warn('normalizeTimestamp: received React element', timestamp);
      return new Date().toISOString();
    }

    // Check if it's a symbol
    if (typeof timestamp === 'symbol') {
      console.warn('normalizeTimestamp: received symbol', timestamp);
      return new Date().toISOString();
    }

    // Check for common datetime object properties
    if (timestamp._isAMomentObject) {
      console.warn('normalizeTimestamp: received moment-like object', timestamp);
      return new Date(timestamp).toISOString();
    }

    // Check for toISOString method
    if (typeof timestamp.toISOString === 'function') {
      console.warn('normalizeTimestamp: received datetime-like object', timestamp);
      return timestamp.toISOString();
    }

    // Check for MongoDB $date format
    if (timestamp.$date) {
      console.warn('normalizeTimestamp: received MongoDB date object', timestamp);
      return new Date(timestamp.$date).toISOString();
    }

    // Check for valueOf method (for objects that might represent dates)
    if (typeof timestamp.valueOf === 'function') {
      try {
        const value = timestamp.valueOf();
        console.warn('normalizeTimestamp: received object with valueOf', value, typeof value);
        return new Date(value).toISOString();
      } catch (e) {
        console.warn('normalizeTimestamp: valueOf failed', e);
      }
    }

    // Handle any other object by trying to convert it
    console.warn('normalizeTimestamp: received unknown object type', typeof timestamp, timestamp);
    try {
      const strValue = String(timestamp);
      console.warn('normalizeTimestamp: converted to string:', strValue);
      return new Date(strValue).toISOString();
    } catch (error) {
      console.error('normalizeTimestamp: failed to convert object to date', timestamp, error);
      return new Date().toISOString();
    }
  }

  // Handle symbols, functions, and other types
  if (typeof timestamp === 'symbol' || typeof timestamp === 'function') {
    console.warn('normalizeTimestamp: received symbol/function', timestamp);
    return new Date().toISOString();
  }

  // Fallback for any other types or edge cases
  try {
    console.warn('normalizeTimestamp: fallback conversion for', timestamp, 'typeof:', typeof timestamp);
    // Try multiple conversion strategies
    let fallbackDate;

    // Strategy 1: Direct Date constructor
    try {
      fallbackDate = new Date(timestamp);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toISOString();
      }
    } catch (e1) {
      console.warn('normalizeTimestamp: Date constructor failed', e1);
    }

    // Strategy 2: String conversion then Date
    try {
      const strValue = String(timestamp);
      fallbackDate = new Date(strValue);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toISOString();
      }
    } catch (e2) {
      console.warn('normalizeTimestamp: String conversion failed', e2);
    }

    // Strategy 3: Check if it's already a valid ISO string
    if (typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)) {
      console.warn('normalizeTimestamp: appears to be ISO string');
      return timestamp;
    }

    console.error('normalizeTimestamp: all conversion strategies failed for', timestamp);
    return new Date().toISOString();
  } catch (error) {
    console.error('normalizeTimestamp: critical fallback failed', timestamp, error);
    return new Date().toISOString();
  }
};

/**
 * Convert UTC timestamp string to local Date object
 */
export const parseUTCTimestamp = (timestamp) => {
  const normalized = normalizeTimestamp(timestamp);
  return new Date(normalized);
};

/**
 * Format timestamp as relative time (e.g., "just now", "5 minutes ago")
 */
export const formatRelativeTime = (timestamp) => {
  try {
    const date = parseUTCTimestamp(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      // For older dates, show formatted date
      return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

/**
 * Format timestamp as time only (e.g., "2:30 PM")
 */
export const formatTimeOnly = (timestamp) => {
  try {
    const date = parseUTCTimestamp(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('Error formatting time:', error);
    return '--:--';
  }
};

/**
 * Format timestamp as date and time (e.g., "Dec 25, 2023, 2:30 PM")
 */
export const formatDateTime = (timestamp) => {
  try {
    const date = parseUTCTimestamp(timestamp);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('Error formatting date time:', error);
    return 'Unknown date';
  }
};

/**
 * Format timestamp as date only (e.g., "Dec 25, 2023")
 */
export const formatDateOnly = (timestamp) => {
  try {
    const date = parseUTCTimestamp(timestamp);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Unknown date';
  }
};
