/**
 * DragDropContext wrapper that is motion-aware and touch-friendly.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import { useMotion } from '../../context/MotionContext';
import { DEFAULT_DND_CONTEXT_PROPS } from '../../config/dndConfig';

export const DragDropContextWrapper = ({ children, onDragStart, onDragUpdate, onDragEnd, enableSensors = true }) => {
  const { prefersReducedMotion } = useMotion();
  const contextProps = enableSensors ? DEFAULT_DND_CONTEXT_PROPS : {};

  return (
    <DragDropContext
      {...contextProps}
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      autoScrollerOptions={{
        disabled: prefersReducedMotion,
        scrollAcceleration: prefersReducedMotion ? 1 : 2,
      }}
    >
      {children}
    </DragDropContext>
  );
};

DragDropContextWrapper.propTypes = {
  children: PropTypes.node,
  onDragStart: PropTypes.func,
  onDragUpdate: PropTypes.func,
  onDragEnd: PropTypes.func.isRequired,
  enableSensors: PropTypes.bool,
};

export default DragDropContextWrapper;
