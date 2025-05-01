// hydration-test.js
/**
 * This script adds a simple hydration test to verify
 * that our React application is correctly hydrating without errors.
 *
 * To use this script, import it in your layout.tsx file
 * or add it via a script tag if testing in development.
 */

if (typeof window !== 'undefined') {
  // This only runs on the client
  window.addEventListener('load', () => {
    const hydrationDiffErrors = [];

    // Override console.error to catch hydration mismatch warnings
    const originalConsoleError = console.error;
    console.error = function (...args) {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        (args[0].includes('hydrat') || args[0].includes('Hydration'))
      ) {
        hydrationDiffErrors.push(args);
      }
      originalConsoleError.apply(console, args);
    };

    // Wait for all React hydration to complete
    setTimeout(() => {
      if (hydrationDiffErrors.length > 0) {
        console.warn(
          '❌ HYDRATION ERRORS DETECTED:',
          hydrationDiffErrors.length
        );
        hydrationDiffErrors.forEach((error, index) => {
          console.warn(`Hydration error ${index + 1}:`, error);
        });
      } else {
        console.log('✅ No hydration errors detected!');
      }
      // Restore original console.error
      console.error = originalConsoleError;
    }, 2000);
  });
}
