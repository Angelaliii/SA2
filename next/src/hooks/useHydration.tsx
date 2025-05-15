"use client";
import { useEffect, useState } from "react";

/**
 * A hook that returns information about component hydration state.
 * Used to prevent hydration mismatches between server and client rendering.
 */
export default function useHydration() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Using setTimeout instead of requestAnimationFrame for more reliable behavior
    // This ensures we're fully in the client rendering phase after hydration
    setTimeout(() => {
      setHasMounted(true);
    }, 0);
  }, []);

  return hasMounted;
}

/**
 * Client-only component wrapper that only renders its children after hydration
 * Enhanced to better handle Material-UI style injection and prevent hydration mismatches
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Use setTimeout instead of requestAnimationFrame for better reliability with MUI
    // This ensures we're past the initial hydration phase before rendering MUI components
    setTimeout(() => {
      setHasMounted(true);
    }, 0);
  }, []);

  // If we haven't mounted yet (server-side or first render), show the fallback
  if (!hasMounted) {
    // Use empty fragment when no fallback is provided to minimize DOM differences
    return fallback ? <>{fallback}</> : null;
  }

  // Once mounted on client, render the actual content
  return <>{children}</>;
}
