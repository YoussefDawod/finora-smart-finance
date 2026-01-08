/**
 * Utilities for optimistic update handlers with common patterns.
 */

/**
 * Creates an optimistic add handler.
 * @param {Array} currentItems
 * @param {Object} newItem
 * @param {Function} setState
 * @returns {Function} Rollback function
 */
export function optimisticAdd(currentItems, newItem, setState) {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const itemWithTempId = { ...newItem, id: tempId, _optimistic: true };

  setState([...currentItems, itemWithTempId]);

  // Rollback function
  return (snapshot = currentItems) => {
    setState(snapshot);
  };
}

/**
 * Creates an optimistic update handler.
 * @param {Array} currentItems
 * @param {string|number} itemId
 * @param {Object} updates
 * @param {Function} setState
 * @returns {Function} Rollback function
 */
export function optimisticUpdate(currentItems, itemId, updates, setState) {
  const snapshot = [...currentItems];

  const updatedItems = currentItems.map((item) =>
    item.id === itemId ? { ...item, ...updates, _optimistic: true } : item
  );

  setState(updatedItems);

  // Rollback function
  return (snapshot) => {
    setState(snapshot);
  };
}

/**
 * Creates an optimistic delete handler.
 * @param {Array} currentItems
 * @param {string|number} itemId
 * @param {Function} setState
 * @returns {Function} Rollback function
 */
export function optimisticDelete(currentItems, itemId, setState) {
  const snapshot = [...currentItems];

  const filteredItems = currentItems.filter((item) => item.id !== itemId);
  setState(filteredItems);

  // Rollback function
  return (snapshot) => {
    setState(snapshot);
  };
}

/**
 * Replaces temporary ID with server-assigned ID.
 * @param {Array} currentItems
 * @param {string|number} tempId
 * @param {Object} serverItem
 * @param {Function} setState
 */
export function replaceOptimisticItem(currentItems, tempId, serverItem, setState) {
  const updatedItems = currentItems.map((item) => {
    if (item.id === tempId) {
      const { _optimistic, ...rest } = serverItem;
      return rest;
    }
    return item;
  });

  setState(updatedItems);
}

/**
 * Confirms an optimistic update by removing the optimistic flag.
 * @param {Array} currentItems
 * @param {string|number} itemId
 * @param {Function} setState
 */
export function confirmOptimisticUpdate(currentItems, itemId, setState) {
  const updatedItems = currentItems.map((item) => {
    if (item.id === itemId) {
      const { _optimistic, ...rest } = item;
      return rest;
    }
    return item;
  });

  setState(updatedItems);
}

/**
 * Removes all optimistic items (used when refreshing from server).
 * @param {Array} currentItems
 * @param {Function} setState
 */
export function removeAllOptimistic(currentItems, setState) {
  const cleanedItems = currentItems.filter((item) => !item._optimistic);
  setState(cleanedItems);
}

/**
 * Merges optimistic items with server data.
 * @param {Array} optimisticItems - Items with optimistic flag
 * @param {Array} serverItems - Server data
 * @returns {Array} Merged items
 */
export function mergeOptimisticWithServer(optimisticItems, serverItems) {
  const serverIds = new Set(serverItems.map((item) => item.id));

  // Keep only optimistic items not yet on server
  const pendingOptimistic = optimisticItems.filter(
    (item) => item._optimistic && !serverIds.has(item.id)
  );

  return [...serverItems, ...pendingOptimistic];
}

export default {
  optimisticAdd,
  optimisticUpdate,
  optimisticDelete,
  replaceOptimisticItem,
  confirmOptimisticUpdate,
  removeAllOptimistic,
  mergeOptimisticWithServer,
};
