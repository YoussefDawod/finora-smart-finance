/**
 * Placeholder für Avatar Komponente
 */

const Avatar = ({ src, alt, size = 'md', initials }) => {
  return (
    <div className={`avatar avatar-${size}`}>
      {src ? <img src={src} alt={alt} /> : <span>{initials}</span>}
    </div>
  );
};

export default Avatar;
