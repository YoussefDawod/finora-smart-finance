/**
 * Placeholder für Radio Komponente
 */

const Radio = ({ label, value, checked, onChange, ...props }) => {
  return (
    <label className="radio-label">
      <input type="radio" className="radio" value={value} checked={checked} onChange={onChange} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Radio;
