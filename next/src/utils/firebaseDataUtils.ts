/**
 * Utility functions for handling Firestore data types consistently
 */

/**
 * Safely converts a Firestore timestamp to a Date object
 * Works with both server and client-side rendering
 */
export const timestampToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();

  // Handle Firestore Timestamp objects
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  // Handle timestamp objects with seconds and nanoseconds
  if (timestamp && timestamp.seconds) {
    return new Date(
      timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
    );
  }

  // Handle timestamp that's already a Date
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Default to current date if we can't parse
  return new Date();
};

/**
 * Format a date consistently regardless of server or client environment
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "No date";

  // Use ISO string format which is consistent across server/client
  return date.toISOString().split("T")[0];
};
