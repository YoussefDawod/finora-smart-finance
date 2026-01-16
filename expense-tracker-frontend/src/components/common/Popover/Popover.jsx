/**
 * Placeholder für Popover Komponente
 */

const Popover = ({ trigger, isOpen, onToggle, children }) => {
  return (
    <div className="popover">
      <button onClick={onToggle} className="popover-trigger">{trigger}</button>
      {isOpen && <div className="popover-content">{children}</div>}
    </div>
  );
};

export default Popover;
