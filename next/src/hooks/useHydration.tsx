import { useEffect, useState } from "react";

/**
 * A hook that returns true when the component is mounted on the client.
 * Used to prevent hydration mismatches between server and client rendering.
 */
export function useHydration() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Using requestAnimationFrame ensures we're fully in the client rendering phase
    // after the initial DOM has been painted
    const raf = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return isMounted;
}

/**
 * Client-only component wrapper that only renders its children after hydration
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isMounted = useHydration();

  if (!isMounted) {
    return fallback;
  }

  return <>{children}</>;
}
