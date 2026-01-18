/**
 * Placeholder für Dropdown Komponente
 */

const Dropdown = ({ trigger, isOpen, onToggle, children }) => {
  return (
    <div className="dropdown">
      <button onClick={onToggle} className="dropdown-trigger">{trigger}</button>
      {isOpen && <div className="dropdown-menu">{children}</div>}
    </div>
  );
};

export default Dropdown;
