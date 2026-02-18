/**
 * @fileoverview Search - Suchkomponente für Header
 * @description Standalone Suchfeld mit Icon und Placeholder
 */

import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Search.module.scss';

export default function Search({
  value = '',
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  isSearching = false,
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('transactions.searchPlaceholder');
  const resolvedAriaLabel = ariaLabel ?? t('transactions.searchAria');
  const handleSearch = (e) => {
    e.preventDefault();
    onSubmit?.(value?.trim?.() || '');
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSearch} role="search">
      <div className={`${styles.searchInputWrapper} ${isSearching ? styles.searching : ''}`}>
        <FiSearch className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={resolvedPlaceholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={resolvedAriaLabel}
          aria-busy={isSearching}
        />
        {isSearching && (
          <span 
            className={styles.searchSpinner} 
            aria-hidden="true"
            role="status"
          />
        )}
      </div>
    </form>
  );
}
