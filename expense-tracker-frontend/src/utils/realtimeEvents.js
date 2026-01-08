/**
 * Utilities for managing real-time event queues and offline support.
 */

const STORAGE_KEY = 'expense_tracker_offline_queue';

/**
 * Event queue for offline operations.
 */
class EventQueue {
  constructor() {
    this.queue = this.loadFromStorage();
  }

  /**
   * Loads queue from localStorage.
   * @returns {Array}
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load event queue:', error);
      return [];
    }
  }

  /**
   * Saves queue to localStorage.
   */
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save event queue:', error);
    }
  }

  /**
   * Adds an event to the queue.
   * @param {Object} event
   * @param {string} event.type - Event type (e.g., 'expense:create')
   * @param {*} event.payload - Event data
   * @param {number} event.timestamp - Event timestamp
   */
  enqueue(event) {
    this.queue.push({
      ...event,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: event.timestamp || Date.now(),
    });
    this.saveToStorage();
  }

  /**
   * Removes and returns the next event.
   * @returns {Object|null}
   */
  dequeue() {
    const event = this.queue.shift();
    this.saveToStorage();
    return event || null;
  }

  /**
   * Returns all events without removing them.
   * @returns {Array}
   */
  peek() {
    return [...this.queue];
  }

  /**
   * Removes all events.
   */
  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Returns queue length.
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * Processes all queued events.
   * @param {Function} processor - Function to process each event
   * @returns {Promise<void>}
   */
  async processAll(processor) {
    while (this.queue.length > 0) {
      const event = this.dequeue();
      try {
        await processor(event);
      } catch (error) {
        console.error('Failed to process event:', event, error);
        // Re-enqueue failed event
        this.queue.unshift(event);
        this.saveToStorage();
        throw error;
      }
    }
  }
}

export const eventQueue = new EventQueue();

/**
 * Helper to emit events with offline queue support.
 * @param {Object} socketService
 * @param {string} event
 * @param {*} data
 * @param {Object} options
 * @param {boolean} options.queueIfOffline - Queue if offline (default: true)
 * @returns {Promise<void>}
 */
export async function emitWithQueue(socketService, event, data, { queueIfOffline = true } = {}) {
  if (socketService.connected) {
    return new Promise((resolve, reject) => {
      socketService.emit(event, data, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  } else if (queueIfOffline) {
    eventQueue.enqueue({ type: event, payload: data });
    throw new Error('Offline: Event queued for later');
  } else {
    throw new Error('Socket not connected');
  }
}

/**
 * Processes offline queue when coming back online.
 * @param {Object} socketService
 */
export async function processOfflineQueue(socketService) {
  if (!socketService.connected) {
    console.warn('Cannot process queue while offline');
    return;
  }

  await eventQueue.processAll(async (event) => {
    return new Promise((resolve, reject) => {
      socketService.emit(event.type, event.payload, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  });
}

export default eventQueue;
