/**
 * Centralized configuration for react-beautiful-dnd.
 */
export const DND_DIRECTIONS = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
};

export const DND_BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const GRID_SIZE = 8;

export const DRAG_CLASSNAMES = {
  dragging: 'is-dragging',
  draggingOver: 'is-dragging-over',
  dropDisabled: 'is-drop-disabled',
};

export const DEFAULT_DND_CONTEXT_PROPS = {
  enableDefaultSensors: true,
};

export const getItemStyle = (snapshot, provided, prefersReducedMotion = false) => {
  const base = {
    userSelect: 'none',
    margin: `0 0 ${GRID_SIZE}px 0`,
    transition: prefersReducedMotion ? 'none' : 'transform 160ms ease, box-shadow 160ms ease',
    boxShadow: snapshot.isDragging ? '0 12px 28px rgba(0,0,0,0.14)' : 'none',
    transform: prefersReducedMotion ? 'none' : provided.draggableProps.style?.transform,
  };

  return {
    ...base,
    ...provided.draggableProps.style,
  };
};

export const getListStyle = (snapshot, prefersReducedMotion = false) => ({
  background: snapshot.isDraggingOver ? 'rgba(32, 128, 144, 0.06)' : 'transparent',
  padding: GRID_SIZE,
  transition: prefersReducedMotion ? 'none' : 'background-color 150ms ease',
});

export const touchSettings = {
  touchStartDelay: 200,
  enableTouch: true,
};

export const motionAware = (prefersReducedMotion) => ({
  dragDropDisabled: prefersReducedMotion,
});

export default {
  GRID_SIZE,
  DND_DIRECTIONS,
  DND_BREAKPOINTS,
  DRAG_CLASSNAMES,
  DEFAULT_DND_CONTEXT_PROPS,
  touchSettings,
  getItemStyle,
  getListStyle,
  motionAware,
};
