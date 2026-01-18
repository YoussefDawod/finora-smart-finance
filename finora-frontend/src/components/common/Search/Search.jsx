/**
 * @fileoverview Search - Suchkomponente für Header
 * @description Standalone Suchfeld mit Icon und Placeholder
 */

import { FiSearch } from 'react-icons/fi';
import styles from './Search.module.scss';

export default function Search({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Transaktionen suchen...',
  ariaLabel = 'Suche nach Transaktionen',
}) {
  const handleSearch = (e) => {
    e.preventDefault();
    onSubmit?.(value?.trim?.() || '');
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSearch}>
      <div className={styles.searchInputWrapper}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={ariaLabel}
        />
      </div>
    </form>
  );
}
