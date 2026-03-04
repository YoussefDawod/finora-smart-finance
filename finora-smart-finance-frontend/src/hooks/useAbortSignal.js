/**
 * @fileoverview useAbortSignal Hook
 * @description Erstellt AbortController-Instanzen und bricht alle
 *              laufenden Requests beim Unmount automatisch ab.
 *              Ersetzt das `mountedRef`-Pattern in allen Hooks.
 *
 * @example
 *   const { createSignal, abort } = useAbortSignal();
 *
 *   useEffect(() => {
 *     const signal = createSignal();
 *     transactionService.getTransactions(params, { signal });
 *     return () => abort(); // oder automatisch beim Unmount
 *   }, [deps]);
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook für automatisches Request-Cancellation beim Unmount.
 * @returns {{ createSignal: () => AbortSignal, abort: () => void, isAborted: (error: unknown) => boolean }}
 */
export function useAbortSignal() {
  /** @type {React.MutableRefObject<Set<AbortController>>} */
  const controllersRef = useRef(new Set());

  /**
   * Erstellt einen neuen AbortController und gibt das Signal zurück.
   * Vorherige Controller werden automatisch abgebrochen (Single-Flight).
   * @returns {AbortSignal}
   */
  const createSignal = useCallback(() => {
    // Vorherige abbrechen (nur den letzten behalten)
    for (const ctrl of controllersRef.current) {
      ctrl.abort();
    }
    controllersRef.current.clear();

    const controller = new AbortController();
    controllersRef.current.add(controller);

    return controller.signal;
  }, []);

  /**
   * Bricht alle aktiven Controller sofort ab.
   */
  const abort = useCallback(() => {
    for (const ctrl of controllersRef.current) {
      ctrl.abort();
    }
    controllersRef.current.clear();
  }, []);

  // Automatisches Cleanup beim Unmount
  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      for (const ctrl of controllers) {
        ctrl.abort();
      }
      controllers.clear();
    };
  }, []);

  return { createSignal, abort, isAborted };
}

/**
 * Prüft ob ein Fehler durch AbortController verursacht wurde.
 * Nützlich in catch-Blöcken um abgebrochene Requests zu ignorieren.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAborted(error) {
  if (!error) return false;
  if (error.name === 'AbortError' || error.name === 'CanceledError') return true;
  if (error.code === 'ERR_CANCELED') return true;
  // Axios-spezifisch
  if (error.__CANCEL__) return true;
  return false;
}
