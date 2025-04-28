import { useEffect, useState } from "react";

/**
 * A hook that returns information about component hydration state.
 * Used to prevent hydration mismatches between server and client rendering.
 */
export default function useHydration() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Using requestAnimationFrame ensures we're fully in the client rendering phase
    // after the initial DOM has been painted
    setHasMounted(true);
  }, []);

  return hasMounted;
}

/**
 * Client-only component wrapper that only renders its children after hydration
 * Enhanced to better handle Material-UI style injection
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
    // Use requestAnimationFrame to ensure we're in the next paint cycle
    // This gives the browser time to apply all styles before showing content
    const timeoutId = setTimeout(() => {
      // Delay the mount state change to ensure styles are processed
      setHasMounted(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  // During server rendering and initial client render, show the fallback
  // This prevents hydration mismatches by completely avoiding rendering the children
  // until we're fully on the client side
  if (!hasMounted) {
    // Return minimal markup for the fallback to minimize hydration issues
    return <div suppressHydrationWarning>{fallback}</div>;
  }

  // Once mounted on client, render the actual content wrapped in a div that
  // suppresses any remaining hydration warnings
  return <div suppressHydrationWarning>{children}</div>;
}
