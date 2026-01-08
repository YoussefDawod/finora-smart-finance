/**
 * Droppable container with motion-friendly wrapper.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Droppable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { useMotion } from '../../context/MotionContext';
import { getListStyle } from '../../config/dndConfig';

export const DraggableContainer = ({ droppableId, direction = 'vertical', className, children, placeholderClassName }) => {
  const { prefersReducedMotion } = useMotion();

  return (
    <Droppable droppableId={droppableId} direction={direction}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          className={className}
          style={getListStyle(snapshot, prefersReducedMotion)}
          {...provided.droppableProps}
        >
          {children}
          <div className={placeholderClassName}>{provided.placeholder}</div>
        </motion.div>
      )}
    </Droppable>
  );
};

DraggableContainer.propTypes = {
  droppableId: PropTypes.string.isRequired,
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  className: PropTypes.string,
  placeholderClassName: PropTypes.string,
  children: PropTypes.node,
};

export default DraggableContainer;
