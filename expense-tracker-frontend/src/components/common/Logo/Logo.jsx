import { Link } from 'react-router-dom';
import styles from './Logo.module.scss';

export default function Logo({ to = '/dashboard', onClick, showText = true }) {
  return (
    <Link to={to} className={styles.logo} onClick={onClick} aria-label="Expense Tracker">
      <div className={styles.logoMark}>
        <span className={styles.logoSymbol}>€</span>
      </div>
      {showText && <span className={styles.logoText}>Expense Tracker</span>}
    </Link>
  );
}
