/**
 * Placeholder für Badge Komponente
 */

const Badge = ({ label, variant = 'primary', size = 'md' }) => {
  return <span className={`badge badge-${variant} badge-${size}`}>{label}</span>;
};

export default Badge;
