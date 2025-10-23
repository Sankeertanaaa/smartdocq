/**
 * Utility functions for handling timestamps consistently across the application
 * Backend stores all timestamps in UTC, but we want to display in user's local time
 */

/**
 * Convert UTC timestamp string to local Date object
 */
export const parseUTCTimestamp = (timestamp) => {
  // Ensure UTC interpretation by adding 'Z' if not present
  const utcString = timestamp + (timestamp.includes('Z') ? '' : 'Z');
  return new Date(utcString);
};

/**
 * Format timestamp as relative time (e.g., "just now", "5 minutes ago")
 */
export const formatRelativeTime = (timestamp) => {
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
};

/**
 * Format timestamp as time only (e.g., "2:30 PM")
 */
export const formatTimeOnly = (timestamp) => {
  const date = parseUTCTimestamp(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format timestamp as date and time (e.g., "Dec 25, 2023, 2:30 PM")
 */
export const formatDateTime = (timestamp) => {
  const date = parseUTCTimestamp(timestamp);
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format timestamp as date only (e.g., "Dec 25, 2023")
 */
export const formatDateOnly = (timestamp) => {
  const date = parseUTCTimestamp(timestamp);
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
