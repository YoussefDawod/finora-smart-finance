import React, { useState, useCallback } from 'react';
import SearchInput from '../Search/SearchInput';
import './FilterBar.scss';

/**
 * FilterBar - Filter & Search kombiniert
 * Props:
 *   - onFilterChange: (filters) => void
 *   - categories: array
 *   - showAdvanced: boolean
 */
function FilterBar({ onFilterChange = () => {}, categories = [] }) {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all', // all, income, expense
    category: 'all',
    sortBy: 'date-desc', // date-desc, date-asc, amount-desc, amount-asc
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Filter Change
  const handleFilterChange = useCallback(
    (newFilters) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    },
    [filters, onFilterChange]
  );

  // Search Handler
  const handleSearch = useCallback(
    (query) => {
      handleFilterChange({ search: query });
    },
    [handleFilterChange]
  );

  // Type Filter Handler
  const handleTypeChange = useCallback(
    (type) => {
      handleFilterChange({ type });
    },
    [handleFilterChange]
  );

  // Category Filter Handler
  const handleCategoryChange = useCallback(
    (category) => {
      handleFilterChange({ category });
    },
    [handleFilterChange]
  );

  // Sort Handler
  const handleSortChange = useCallback(
    (sortBy) => {
      handleFilterChange({ sortBy });
    },
    [handleFilterChange]
  );

  // Reset Filters
  const handleReset = useCallback(() => {
    const defaultFilters = {
      search: '',
      type: 'all',
      category: 'all',
      sortBy: 'date-desc',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    setIsExpanded(false);
  }, [onFilterChange]);

  // Prüfe ob Filter aktiv sind
  const hasActiveFilters =
    filters.search ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.sortBy !== 'date-desc';

  return (
    <div className="filter-bar">
      {/* Main Row: Search + Toggle */}
      <div className="filter-bar__main">
        <div className="filter-bar__search">
          <SearchInput placeholder="Transaktion suchen..." onSearch={handleSearch} />
        </div>

        <button
          className={`filter-bar__toggle ${isExpanded ? 'filter-bar__toggle--active' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          title="Filter erweitern"
        >
          ⚙️ Filter
          {hasActiveFilters && <span className="filter-bar__badge">{1}</span>}
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="filter-bar__expanded animate-slide-in-down">
          <div className="filter-bar__row">
            {/* Type Filter */}
            <div className="filter-bar__group">
              <label className="filter-bar__label">Typ</label>
              <div className="filter-bar__chips">
                {['all', 'income', 'expense'].map((type) => (
                  <button
                    key={type}
                    className={`filter-bar__chip ${filters.type === type ? 'filter-bar__chip--active' : ''}`}
                    onClick={() => handleTypeChange(type)}
                  >
                    {type === 'all' ? '📊 Alle' : type === 'income' ? '💰 Einnahmen' : '💸 Ausgaben'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-bar__group">
              <label className="filter-bar__label">Kategorie</label>
              <select
                className="filter-bar__select"
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="all">Alle Kategorien</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="filter-bar__group">
              <label className="filter-bar__label">Sortierung</label>
              <select
                className="filter-bar__select"
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="date-desc">Neueste zuerst</option>
                <option value="date-asc">Älteste zuerst</option>
                <option value="amount-desc">Höchster Betrag</option>
                <option value="amount-asc">Niedrigster Betrag</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="filter-bar__actions">
            {hasActiveFilters && (
              <button
                className="btn btn--outline btn--sm"
                onClick={handleReset}
              >
                🔄 Zurücksetzen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
