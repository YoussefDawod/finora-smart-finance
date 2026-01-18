/**
 * Placeholder für Alert Komponente
 */

const Alert = ({ type = 'info', message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <p>{message}</p>
      {onClose && <button onClick={onClose}>✕</button>}
    </div>
  );
};

export default Alert;
