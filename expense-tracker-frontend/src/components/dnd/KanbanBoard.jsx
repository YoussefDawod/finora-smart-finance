/**
 * Simple Kanban board with multiple droppable columns.
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import DraggableContainer from './DraggableContainer';
import DraggableItem from './DraggableItem';
import { reorderBetweenLists, reorderList } from '../../utils/dndHandlers';

export const KanbanBoard = ({ columns, onChange }) => {
  const handleDragEnd = useCallback(
    (result) => {
      const { source, destination } = result;
      if (!destination) return;

      const columnMap = columns.reduce((acc, col) => {
        acc[col.id] = col.items;
        return acc;
      }, {});

      let nextMap;
      if (source.droppableId === destination.droppableId) {
        nextMap = {
          ...columnMap,
          [source.droppableId]: reorderList(columnMap[source.droppableId], source.index, destination.index),
        };
      } else {
        nextMap = reorderBetweenLists(columnMap, source, destination);
      }

      const nextColumns = columns.map((col) => ({ ...col, items: nextMap[col.id] || [] }));
      if (onChange) onChange(nextColumns, result);
    },
    [columns, onChange]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map((col) => (
          <div className="kanban-column" key={col.id}>
            <header className="kanban-column__header">
              <h4>{col.title}</h4>
            </header>
            <DraggableContainer droppableId={col.id} className="kanban-column__body">
              {col.items.map((item, index) => (
                <DraggableItem key={item.id} itemId={item.id} index={index} total={col.items.length}>
                  {col.renderItem ? col.renderItem(item, index) : <div>{item.content}</div>}
                </DraggableItem>
              ))}
            </DraggableContainer>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

KanbanBoard.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      items: PropTypes.array.isRequired,
      renderItem: PropTypes.func,
    })
  ).isRequired,
  onChange: PropTypes.func,
};

export default KanbanBoard;
