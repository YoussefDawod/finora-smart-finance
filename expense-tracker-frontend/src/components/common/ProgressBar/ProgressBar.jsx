/**
 * Placeholder für ProgressBar Komponente
 */

const ProgressBar = ({ value = 0, max = 100, color = 'primary', label }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="progress-bar">
      {label && <label>{label}</label>}
      <div className="progress-track">
        <div className={`progress-fill progress-${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="progress-label">{Math.round(percentage)}%</span>
    </div>
  );
};

export default ProgressBar;
