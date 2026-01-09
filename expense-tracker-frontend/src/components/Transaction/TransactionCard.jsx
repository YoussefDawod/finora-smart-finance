import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import IconLibrary from '../IconLibrary';
import { getCategoryIconName } from '../../utils';
import { cardVariants } from '../../config/animationVariants';
import './TransactionCard.scss';

/**
 * TransactionCard - Einzelne Transaktion
 * Props:
 *   - id: string
 *   - amount: number
 *   - category: string
 *   - description: string
 *   - date: string (YYYY-MM-DD)
 *   - type: 'income' | 'expense'
 *   - onEdit: (id) => void
 *   - onDelete: (id) => void
 */
function TransactionCard({ id, amount, category, description, date, type, onEdit, onDelete }) {
  const reduceMotion = useReducedMotion();
  const variants = cardVariants(reduceMotion);
  const iconName = getCategoryIconName(category, type);
  const isExpense = type === 'expense';
  const amountClass = isExpense ? 'transaction-card__amount--expense' : 'transaction-card__amount--income';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <motion.article
      className="transaction-card"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
    >
      <div className="transaction-card__left">
        <div className="transaction-card__avatar glass shadow-elevated">
          <IconLibrary name={iconName} size={22} aria-hidden />
          <span className="sr-only">{category}</span>
        </div>
        <div className="transaction-card__info">
          <h3 className="transaction-card__description">{description}</h3>
          <p className="transaction-card__category">{category}</p>
          <p className="transaction-card__date">{formatDate(date)}</p>
        </div>
      </div>

      <div className={`transaction-card__amount ${amountClass}`}>
        <span className="transaction-card__sign">{isExpense ? '−' : '+'}</span>
        {formatCurrency(amount)}
      </div>

      <div className="transaction-card__actions">
        <button
          className="transaction-card__btn transaction-card__btn--edit"
          onClick={() => onEdit(id)}
          title="Bearbeiten"
          aria-label={`Bearbeiten: ${description}`}
        >
          <IconLibrary name="pencil-square" size={18} />
        </button>
        <button
          className="transaction-card__btn transaction-card__btn--delete"
          onClick={() => onDelete(id)}
          title="Löschen"
          aria-label={`Löschen: ${description}`}
        >
          <IconLibrary name="trash" size={18} />
        </button>
      </div>
    </motion.article>
  );
}

export default TransactionCard;
