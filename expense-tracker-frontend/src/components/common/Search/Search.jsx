/**
 * @fileoverview Search - Suchkomponente für Header
 * @description Standalone Suchfeld mit Icon und Placeholder
 */

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import styles from './Search.module.scss';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search:', searchQuery);
      // TODO: Suchfunktion implementieren
    }
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSearch}>
      <div className={styles.searchInputWrapper}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Transaktionen suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Suche nach Transaktionen"
        />
      </div>
    </form>
  );
}
