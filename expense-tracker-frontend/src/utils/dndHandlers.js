/**
 * Helper functions for drag & drop ordering.
 */

export const reorderList = (list = [], startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const reorderBetweenLists = (lists, source, destination) => {
  const sourceList = Array.from(lists[source.droppableId] || []);
  const destList = Array.from(lists[destination.droppableId] || []);
  const [moved] = sourceList.splice(source.index, 1);
  destList.splice(destination.index, 0, moved);

  return {
    ...lists,
    [source.droppableId]: sourceList,
    [destination.droppableId]: destList,
  };
};

export const detectConflict = (currentToken, incomingToken) => currentToken !== incomingToken;

export const buildReorderResult = (lists) => ({ lists });

export const withOptimisticUpdate = async (operation, rollback) => {
  try {
    await operation();
  } catch (error) {
    if (rollback) rollback();
    throw error;
  }
};
