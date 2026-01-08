/**
 * Reusable drag-and-drop list with auto-reordering.
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import DraggableContainer from './DraggableContainer';
import DraggableItem from './DraggableItem';
import { reorderList } from '../../utils/dndHandlers';

export const DnDList = ({ droppableId, items, renderItem, onReorder, direction = 'vertical', className }) => {
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      const newItems = reorderList(items, result.source.index, result.destination.index);
      if (onReorder) onReorder(newItems, result);
    },
    [items, onReorder]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <DraggableContainer droppableId={droppableId} direction={direction} className={className}>
        {items.map((item, index) => (
          <DraggableItem key={item.id} itemId={item.id} index={index} total={items.length}>
            {renderItem(item, index)}
          </DraggableItem>
        ))}
      </DraggableContainer>
    </DragDropContext>
  );
};

DnDList.propTypes = {
  droppableId: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderItem: PropTypes.func.isRequired,
  onReorder: PropTypes.func,
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  className: PropTypes.string,
};

export default DnDList;
