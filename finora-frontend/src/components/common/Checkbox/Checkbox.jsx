/**
 * Placeholder für Checkbox Komponente
 */

const Checkbox = ({ label, checked, onChange, ...props }) => {
  return (
    <label className="checkbox-label">
      <input type="checkbox" className="checkbox" checked={checked} onChange={onChange} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;
