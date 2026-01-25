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
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('transactions.searchPlaceholder');
  const resolvedAriaLabel = ariaLabel ?? t('transactions.searchAria');
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
          placeholder={resolvedPlaceholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={resolvedAriaLabel}
        />
      </div>
    </form>
  );
}
