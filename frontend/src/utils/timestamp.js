/**
 * Utility functions for handling timestamps consistently across the application
 * Backend stores all timestamps in UTC, but we want to display in user's local time
 */

/**
 * Safely convert various timestamp formats to a consistent string format
 */
const normalizeTimestamp = (timestamp) => {
  // Handle null, undefined, or empty values
  if (!timestamp) {
    return new Date().toISOString();
  }

  // If it's already a Date object, convert to ISO string
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  // If it's a number (timestamp in milliseconds), convert to Date then ISO string
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }

  // If it's a string, ensure it has timezone info
  if (typeof timestamp === 'string') {
    // Add 'Z' if it doesn't have timezone info
    return timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-')
      ? timestamp
      : timestamp + 'Z';
  }

  // If it's not a string, convert to string first
  if (timestamp && typeof timestamp === 'object') {
    // If it has toISOString method (Date object), use it
    if (typeof timestamp.toISOString === 'function') {
      return timestamp.toISOString();
    }
    // Otherwise convert to string
    return String(timestamp);
  }

  // Fallback for any other type
  return String(timestamp || '');

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
