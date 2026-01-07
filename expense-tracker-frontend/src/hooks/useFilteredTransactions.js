import { useMemo } from 'react';

/**
 * Hook für gefilterte & sortierte Transaktionen
 */
function useFilteredTransactions(transactions, filters = {}) {
  const { search = '', type = 'all', category = 'all', sortBy = 'date-desc' } = filters;

  // Filtering & Sorting
  const filtered = useMemo(() => {
    let result = [...transactions];

    // Type Filter
    if (type !== 'all') {
      result = result.filter((t) => t.type === type);
    }

    // Category Filter
    if (category !== 'all') {
      result = result.filter((t) => t.category === category);
    }

    // Search Filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, search, type, category, sortBy]);

  return {
    filtered,
    count: filtered.length,
  };
}

export default useFilteredTransactions;
