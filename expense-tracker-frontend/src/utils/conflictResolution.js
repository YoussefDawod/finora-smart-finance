/**
 * Conflict resolution strategies for real-time sync.
 */

/**
 * Conflict resolution strategy enum.
 */
export const CONFLICT_STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',
  CLIENT_WINS: 'client_wins',
  SERVER_WINS: 'server_wins',
  MANUAL: 'manual',
};

/**
 * Compares timestamps to determine which version is newer.
 * @param {number|string} timestamp1
 * @param {number|string} timestamp2
 * @returns {number} -1 if timestamp1 is older, 1 if newer, 0 if equal
 */
export function compareTimestamps(timestamp1, timestamp2) {
  const t1 = new Date(timestamp1).getTime();
  const t2 = new Date(timestamp2).getTime();

  if (t1 < t2) return -1;
  if (t1 > t2) return 1;
  return 0;
}

/**
 * Resolves conflict using last-write-wins strategy.
 * @param {Object} localItem - Local version
 * @param {Object} remoteItem - Remote version
 * @param {string} timestampField - Field name for timestamp (default: 'updatedAt')
 * @returns {Object} Winning version
 */
export function lastWriteWins(localItem, remoteItem, timestampField = 'updatedAt') {
  const comparison = compareTimestamps(localItem[timestampField], remoteItem[timestampField]);

  if (comparison >= 0) {
    return { winner: localItem, source: 'local', conflict: comparison === 0 };
  } else {
    return { winner: remoteItem, source: 'remote', conflict: false };
  }
}

/**
 * Resolves conflict by always choosing client version.
 * @param {Object} localItem
 * @param {Object} remoteItem
 * @returns {Object}
 */
export function clientWins(localItem, remoteItem) {
  return { winner: localItem, source: 'local', conflict: true };
}

/**
 * Resolves conflict by always choosing server version.
 * @param {Object} localItem
 * @param {Object} remoteItem
 * @returns {Object}
 */
export function serverWins(localItem, remoteItem) {
  return { winner: remoteItem, source: 'remote', conflict: true };
}

/**
 * Detects conflicts between local and remote items.
 * @param {Array} localItems
 * @param {Array} remoteItems
 * @param {string} idField - Field name for ID (default: 'id')
 * @param {string} timestampField - Field name for timestamp (default: 'updatedAt')
 * @returns {Array} Array of conflicts
 */
export function detectConflicts(localItems, remoteItems, idField = 'id', timestampField = 'updatedAt') {
  const conflicts = [];
  const remoteMap = new Map(remoteItems.map((item) => [item[idField], item]));

  for (const localItem of localItems) {
    const remoteItem = remoteMap.get(localItem[idField]);

    if (remoteItem) {
      const localTimestamp = new Date(localItem[timestampField]).getTime();
      const remoteTimestamp = new Date(remoteItem[timestampField]).getTime();

      // Conflict if both have been modified
      if (localTimestamp !== remoteTimestamp) {
        conflicts.push({
          id: localItem[idField],
          local: localItem,
          remote: remoteItem,
          localTimestamp,
          remoteTimestamp,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Resolves multiple conflicts using a strategy.
 * @param {Array} conflicts - Array of conflict objects
 * @param {string} strategy - Conflict resolution strategy
 * @param {string} timestampField - Field name for timestamp (default: 'updatedAt')
 * @returns {Array} Resolved items
 */
export function resolveConflicts(conflicts, strategy = CONFLICT_STRATEGIES.LAST_WRITE_WINS, timestampField = 'updatedAt') {
  return conflicts.map((conflict) => {
    let resolution;

    switch (strategy) {
      case CONFLICT_STRATEGIES.LAST_WRITE_WINS:
        resolution = lastWriteWins(conflict.local, conflict.remote, timestampField);
        break;

      case CONFLICT_STRATEGIES.CLIENT_WINS:
        resolution = clientWins(conflict.local, conflict.remote);
        break;

      case CONFLICT_STRATEGIES.SERVER_WINS:
        resolution = serverWins(conflict.local, conflict.remote);
        break;

      case CONFLICT_STRATEGIES.MANUAL:
        // Return both for manual resolution
        return { ...conflict, requiresManualResolution: true };

      default:
        resolution = lastWriteWins(conflict.local, conflict.remote, timestampField);
    }

    return {
      id: conflict.id,
      ...resolution,
    };
  });
}

/**
 * Merges local and remote items with conflict resolution.
 * @param {Array} localItems
 * @param {Array} remoteItems
 * @param {Object} options
 * @param {string} options.strategy - Resolution strategy
 * @param {string} options.idField - ID field name
 * @param {string} options.timestampField - Timestamp field name
 * @returns {Object} Merged result with conflicts
 */
export function mergeWithConflictResolution(
  localItems,
  remoteItems,
  { strategy = CONFLICT_STRATEGIES.LAST_WRITE_WINS, idField = 'id', timestampField = 'updatedAt' } = {}
) {
  const conflicts = detectConflicts(localItems, remoteItems, idField, timestampField);
  const resolutions = resolveConflicts(conflicts, strategy, timestampField);

  const resolvedMap = new Map(resolutions.map((r) => [r.id, r.winner]));
  const localMap = new Map(localItems.map((item) => [item[idField], item]));
  const remoteMap = new Map(remoteItems.map((item) => [item[idField], item]));

  const mergedItems = [];
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const id of allIds) {
    if (resolvedMap.has(id)) {
      // Use resolved version
      mergedItems.push(resolvedMap.get(id));
    } else if (localMap.has(id) && remoteMap.has(id)) {
      // No conflict, use either (they're identical)
      mergedItems.push(remoteMap.get(id));
    } else {
      // Only exists in one source
      mergedItems.push(localMap.get(id) || remoteMap.get(id));
    }
  }

  return {
    items: mergedItems,
    conflicts: conflicts.length,
    resolutions,
  };
}

/**
 * Generates a version hash for tracking changes.
 * @param {Object} item
 * @returns {string}
 */
export function generateVersionHash(item) {
  const sortedKeys = Object.keys(item).sort();
  const valueString = sortedKeys.map((key) => `${key}:${JSON.stringify(item[key])}`).join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < valueString.length; i++) {
    const char = valueString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(36);
}

export default {
  CONFLICT_STRATEGIES,
  compareTimestamps,
  lastWriteWins,
  clientWins,
  serverWins,
  detectConflicts,
  resolveConflicts,
  mergeWithConflictResolution,
  generateVersionHash,
};
