/**
 * Utilities for safely handling client-side only functionality
 */

/**
 * Check if code is running on client side
 */
export const isClient = typeof window !== "undefined";

/**
 * Safely execute a function only on the client side
 */
export const executeOnClient = (callback: () => void, delay = 0) => {
  if (isClient) {
    if (delay > 0) {
      setTimeout(callback, delay);
    } else {
      callback();
    }
  }
};

/**
 * Safely scroll to top, only on client side
 */
export const scrollToTop = (smooth = true, delay = 0) => {
  executeOnClient(() => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto",
    });
  }, delay);
};

/**
 * Safely format a date to avoid hydration mismatches
 * By using toISOString, we ensure the format is consistent between server and client
 */
export const formatDateSafe = (
  date: Date | string | number | undefined | null
): string => {
  if (!date) return "";

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    // Use ISO string which is guaranteed to be consistent across server and client
    return dateObj.toISOString().split("T")[0];
  } catch (error) {
    console.error("Date formatting error:", error);
    return "";
  }
};

/**
 * Hook to use in client components to ensure they only render after hydration
 * Use this to prevent hydration mismatches with components that depend on browser APIs
 *
 * Example:
 * ```
 * const isMounted = useHydration();
 * if (!isMounted) return null; // or a placeholder
 * ```
 */
export const useHydration = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Using requestAnimationFrame ensures we're fully in the client rendering phase
    const raf = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return isMounted;
};

// Need to import useState and useEffect for the hook above
import { useEffect, useState } from "react";
