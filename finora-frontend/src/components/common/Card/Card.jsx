/**
 * Placeholder für Common Card Komponente
 */

const Card = ({ children, ...props }) => {
  return <div className="card" {...props}>{children}</div>;
};

export default Card;
