import { useCallback, useState } from 'react';

/**
 * useAsyncError Hook
 * 
 * Ermöglicht es, asynchrone Fehler (z.B. in Promises) an ErrorBoundary weiterzuleiten.
 * ErrorBoundary fängt nur synchrone Fehler in render() - dieser Hook macht async Errors sichtbar.
 * 
 * @example
 * const throwAsyncError = useAsyncError();
 * 
 * try {
 *   await fetchData();
 * } catch (error) {
 *   throwAsyncError(error); // Wirft Fehler in render() -> ErrorBoundary fängt ihn
 * }
 */
export const useAsyncError = () => {
  const [, setError] = useState();

  return useCallback((error) => {
    setError(() => {
      // Durch Werfen eines Errors im setState Updater
      // wird der Fehler während des Renders geworfen
      throw error;
    });
  }, []);
};

export default useAsyncError;
