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
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  // 使用單獨的 state 避免共享狀態導致的問題
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
