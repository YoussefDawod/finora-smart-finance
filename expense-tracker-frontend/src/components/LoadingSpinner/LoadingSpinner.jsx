import PropTypes from 'prop-types';
import './LoadingSpinner.scss';

/**
 * LoadingSpinner - Wiederverwendbare Ladeanimation
 * 
 * @param {string} size - sm, md, lg (default: md)
 * @param {boolean} fullscreen - Fullscreen Overlay (default: false)
 * @param {string} message - Optionale Nachricht unter Spinner
 */
export const LoadingSpinner = ({ size = 'md', fullscreen = false, message = '' }) => {
  const content = (
    <div className={`spinner spinner--${size}`} role="status" aria-live="polite">
      <div className="spinner__circle"></div>
      <span className="sr-only">Lädt...</span>
      {message && <p className="spinner__message">{message}</p>}
    </div>
  );

  if (fullscreen) {
    return <div className="spinner-fullscreen">{content}</div>;
  }

  return content;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullscreen: PropTypes.bool,
  message: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  size: 'md',
  fullscreen: false,
  message: '',
};

export default LoadingSpinner;
