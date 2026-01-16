/**
 * @fileoverview Filter - Filterkomponente für Header
 * @description Dropdown-Filter mit verschiedenen Filteroptionen
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import styles from './Filter.module.scss';

export default function Filter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    period: null,
    type: null,
  });

  const handleFilterChange = (category, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: prev[category] === value ? null : value,
    }));
  };

  const filterOptions = {
    period: [
      { label: 'Heute', value: 'today' },
      { label: 'Diese Woche', value: 'week' },
      { label: 'Dieser Monat', value: 'month' },
      { label: 'Dieses Jahr', value: 'year' },
    ],
    type: [
      { label: 'Einnahmen', value: 'income' },
      { label: 'Ausgaben', value: 'expense' },
    ],
  };

  return (
    <div className={styles.filterWrapper}>
      <button
        className={`${styles.filterBtn} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Filter öffnen"
      >
        <FiFilter size={18} />
        <span>Filter</span>
        <FiChevronDown size={16} className={styles.chevron} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.filterDropdown}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* Zeitraum */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Zeitraum</h4>
              <div className={styles.filterOptions}>
                {filterOptions.period.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${
                      activeFilters.period === option.value ? styles.selected : ''
                    }`}
                    onClick={() => handleFilterChange('period', option.value)}
                  >
                    <span className={styles.checkbox} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterDivider} />

            {/* Typ */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Typ</h4>
              <div className={styles.filterOptions}>
                {filterOptions.type.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${
                      activeFilters.type === option.value ? styles.selected : ''
                    }`}
                    onClick={() => handleFilterChange('type', option.value)}
                  >
                    <span className={styles.checkbox} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
