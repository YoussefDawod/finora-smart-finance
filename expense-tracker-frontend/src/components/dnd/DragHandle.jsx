/**
 * Accessible drag handle with grab cursor and optional icon.
 */
import React from 'react';
import PropTypes from 'prop-types';

export const DragHandle = ({ className = '', label = 'Drag handle', ...rest }) => (
  <span
    className={`drag-handle ${className}`.trim()}
    role="button"
    aria-label={label}
    tabIndex={0}
    {...rest}
  >
    ⋮⋮
  </span>
);

DragHandle.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
};

export default DragHandle;
