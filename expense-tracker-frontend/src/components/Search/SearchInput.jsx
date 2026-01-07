import React, { useState, useCallback, useRef, useEffect } from 'react';
import './SearchInput.scss';

/**
 * SearchInput - Suchfeld mit Debounce & Clear-Button
 * Props:
 *   - placeholder: string
 *   - onSearch: (query) => void
 *   - debounceMs: number (default 300)
 *   - clearable: boolean (default true)
 */
function SearchInput({ 
  placeholder = 'Suchen...', 
  onSearch = () => {}, 
  debounceMs = 300,
  clearable = true 
}) {
  const [query, setQuery] = useState('');
  const debounceTimerRef = useRef(null);

  // Debounced Search
  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);

      // Clear vorheriger Timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Neuer Timer
      debounceTimerRef.current = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="search-input">
      <span className="search-input__icon">🔍</span>
      <input
        type="text"
        className="search-input__field"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        aria-label={placeholder}
      />
      {clearable && query && (
        <button
          className="search-input__clear"
          onClick={handleClear}
          title="Löschen"
          aria-label="Suchfeld löschen"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchInput;
