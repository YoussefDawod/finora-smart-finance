import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TransactionCard from './TransactionCard';
import SkeletonCard from '../Skeleton/SkeletonCard';
import { listVariants } from '../../config/animationVariants';
import './TransactionList.scss';

/**
 * TransactionList - Liste mit Transaktionen
 * Props:
 *   - transactions: array
 *   - loading: boolean
 *   - error: string | null
 *   - onEdit: (id) => void
 *   - onDelete: (id) => void
 *   - pagination: { page, limit, total, pages }
 *   - onPageChange: (page) => void
 */
function TransactionList({
  transactions = [],
  loading = false,
  error = null,
  onEdit = () => {},
  onDelete = () => {},
  pagination = {},
  onPageChange = () => {},
}) {
  const { page = 1, pages = 1 } = pagination;
  const reduceMotion = useReducedMotion();
  const variants = listVariants(reduceMotion);

  if (error) {
    return (
      <div className="transaction-list__error">
        <p className="text-muted">❌ Fehler beim Laden: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="transaction-list">
        <SkeletonCard variant="transaction" count={5} />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="transaction-list__empty">
        <p className="text-muted">Keine Transaktionen vorhanden</p>
        <p className="text-small text-muted">Erstelle deine erste Transaktion! 💰</p>
      </div>
    );
  }

  return (
    <motion.div className="transaction-list" initial="hidden" animate="show" variants={variants.container}>
      <motion.div className="transaction-list__items" variants={variants.container}>
        <AnimatePresence>
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              variants={variants.item}
              layout={!reduceMotion}
              exit="exit"
            >
              <TransactionCard
                id={transaction.id}
                amount={transaction.amount}
                category={transaction.category}
                description={transaction.description}
                date={transaction.date}
                type={transaction.type}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {pages > 1 && (
        <div className="transaction-list__pagination">
          <button
            className="btn btn--outline btn--sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            ← Zurück
          </button>

          <span className="transaction-list__pagination-info">
            Seite {page} von {pages}
          </span>

          <button
            className="btn btn--outline btn--sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
          >
            Weiter →
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default TransactionList;
