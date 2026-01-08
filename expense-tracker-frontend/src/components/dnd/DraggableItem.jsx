/**
 * Draggable item rendered as a motion.div.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Draggable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { getItemStyle } from '../../config/dndConfig';
import { buildAriaDraggableProps } from '../../utils/dndAccessibility';

export const DraggableItem = ({ itemId, index, children, className, ariaLabel, total }) => {
  const { prefersReducedMotion } = useMotion();

  return (
    <Draggable draggableId={itemId} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          className={`${className || ''} ${snapshot.isDragging ? 'is-dragging' : ''}`.trim()}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          {...buildAriaDraggableProps({ index, total, label: ariaLabel || itemId })}
          style={getItemStyle(snapshot, provided, prefersReducedMotion)}
          whileDrag={prefersReducedMotion ? undefined : { scale: 1.02, y: -8, boxShadow: '0 16px 32px rgba(0,0,0,0.16)' }}
        >
          {children}
        </motion.div>
      )}
    </Draggable>
  );
};

DraggableItem.propTypes = {
  itemId: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  total: PropTypes.number,
};

export default DraggableItem;
