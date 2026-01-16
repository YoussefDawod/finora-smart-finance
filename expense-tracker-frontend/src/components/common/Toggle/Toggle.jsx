/**
 * Placeholder für Toggle Komponente
 */

const Toggle = ({ checked, onChange, label, ...props }) => {
  return (
    <label className="toggle-label">
      <input type="checkbox" className="toggle" checked={checked} onChange={onChange} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Toggle;
