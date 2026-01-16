/**
 * Placeholder für Divider Komponente
 */

const Divider = ({ text, direction = 'horizontal' }) => {
  return (
    <div className={`divider divider-${direction}`}>
      {text && <span className="divider-text">{text}</span>}
    </div>
  );
};

export default Divider;
