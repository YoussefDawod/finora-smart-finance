/**
 * Visual drop zone indicator.
 */
import React from 'react';
import PropTypes from 'prop-types';

export const DropZone = ({ active, children, className = '' }) => (
  <div className={`drop-zone ${active ? 'drop-zone--active' : ''} ${className}`.trim()}>
    {children}
  </div>
);

DropZone.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default DropZone;
