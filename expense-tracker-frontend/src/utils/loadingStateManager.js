/**
 * Loading state management utilities.
 */

/**
 * Loading state enum.
 */
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  SKELETON: 'skeleton',
};

/**
 * Loading state manager class.
 */
export class LoadingStateManager {
  constructor() {
    this.states = new Map();
    this.timeouts = new Map();
    this.listeners = new Map();
  }

  /**
   * Sets loading state for a specific key.
   * @param {string} key - State identifier
   * @param {string} state - Loading state
   * @param {*} data - Optional data payload
   */
  setState(key, state, data = null) {
    const previousState = this.states.get(key);
    const newState = {
      state,
      data,
      timestamp: Date.now(),
      previousState: previousState?.state || LOADING_STATES.IDLE,
    };

    this.states.set(key, newState);

    // Notify listeners
    const listeners = this.listeners.get(key) || [];
    listeners.forEach((listener) => listener(newState));
  }

  /**
   * Gets current state for a key.
   * @param {string} key
   * @returns {Object|null}
   */
  getState(key) {
    return this.states.get(key) || null;
  }

  /**
   * Clears state for a key.
   * @param {string} key
   */
  clearState(key) {
    this.states.delete(key);
    this.clearTimeout(key);
    this.listeners.delete(key);
  }

  /**
   * Subscribes to state changes.
   * @param {string} key
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(listener);

    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Sets a timeout to automatically transition to skeleton state.
   * @param {string} key
   * @param {number} delay - Delay in milliseconds (default: 200ms)
   * @param {number} skeletonThreshold - Show skeleton after this delay (default: 3000ms)
   */
  setLoadingTimeout(key, delay = 200, skeletonThreshold = 3000) {
    this.clearTimeout(key);

    const timeoutId = setTimeout(() => {
      const currentState = this.getState(key);
      if (currentState?.state === LOADING_STATES.LOADING) {
        this.setState(key, LOADING_STATES.SKELETON);
      }
    }, delay);

    this.timeouts.set(key, timeoutId);

    // Set error timeout for prolonged loading
    const errorTimeoutId = setTimeout(() => {
      const currentState = this.getState(key);
      if (
        currentState?.state === LOADING_STATES.LOADING ||
        currentState?.state === LOADING_STATES.SKELETON
      ) {
        this.setState(key, LOADING_STATES.ERROR, {
          error: 'Request timeout',
        });
      }
    }, skeletonThreshold);

    this.timeouts.set(`${key}_error`, errorTimeoutId);
  }

  /**
   * Clears timeout for a key.
   * @param {string} key
   */
  clearTimeout(key) {
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }

    const errorTimeoutId = this.timeouts.get(`${key}_error`);
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId);
      this.timeouts.delete(`${key}_error`);
    }
  }

  /**
   * Checks if loading duration is fast (< 200ms).
   * @param {string} key
   * @returns {boolean}
   */
  isFastLoad(key) {
    const state = this.getState(key);
    if (!state) return false;

    const duration = Date.now() - state.timestamp;
    return duration < 200;
  }

  /**
   * Resets all states.
   */
  reset() {
    this.states.clear();
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const loadingStateManager = new LoadingStateManager();

export default loadingStateManager;
