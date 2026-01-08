/**
 * State container for drag & drop flows with optimistic updates and rollback.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { reorderList, reorderBetweenLists } from '../utils/dndHandlers';

export const useDragDropState = ({ initialLists = {}, onPersist } = {}) => {
  const [lists, setLists] = useState(initialLists);
  const [dragState, setDragState] = useState({ active: false, source: null, destination: null });
  const historyRef = useRef([]);
  const futureRef = useRef([]);

  const pushHistory = useCallback(
    (prev) => {
      historyRef.current.push(prev);
      futureRef.current = [];
    },
    []
  );

  const rollback = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) {
      setLists(prev);
    }
  }, []);

  const onDragStart = useCallback((start) => {
    setDragState({ active: true, source: start.source, destination: null });
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const onDragUpdate = useCallback((update) => {
    setDragState((prev) => ({ ...prev, destination: update.destination }));
  }, []);

  const onDragEnd = useCallback(
    async (result) => {
      const { source, destination } = result;
      setDragState({ active: false, source: null, destination: null });

      if (!destination) return;

      const prevLists = lists;
      let nextLists = prevLists;

      if (source.droppableId === destination.droppableId) {
        nextLists = {
          ...prevLists,
          [source.droppableId]: reorderList(prevLists[source.droppableId], source.index, destination.index),
        };
      } else {
        nextLists = reorderBetweenLists(prevLists, source, destination);
      }

      if (nextLists === prevLists) return;

      pushHistory(prevLists);
      setLists(nextLists);

      if (onPersist) {
        try {
          await onPersist(nextLists, { source, destination });
        } catch (error) {
          console.warn('DnD persist failed, rolling back', error);
          rollback();
        }
      }
    },
    [lists, onPersist, pushHistory, rollback]
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(lists);
    setLists(prev);
  }, [lists]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(lists);
    setLists(next);
  }, [lists]);

  return useMemo(
    () => ({ lists, setLists, dragState, onDragStart, onDragUpdate, onDragEnd, undo, redo }),
    [lists, dragState, onDragStart, onDragUpdate, onDragEnd, undo, redo]
  );
};
