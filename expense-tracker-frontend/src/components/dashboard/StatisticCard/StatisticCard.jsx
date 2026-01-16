/**
 * Placeholder für StatisticCard Komponente
 */

const StatisticCard = ({ label, value, icon }) => {
  return (
    <div className="statistic-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
};

export default StatisticCard;
