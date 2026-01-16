/**
 * Placeholder für Tooltip Komponente
 */

const Tooltip = ({ text, children }) => {
  return (
    <div className="tooltip-wrapper">
      {children}
      <div className="tooltip">{text}</div>
    </div>
  );
};

export default Tooltip;
