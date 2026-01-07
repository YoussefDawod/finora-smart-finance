import React from 'react';
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
  const categoryEmojis = {
    Lebensmittel: '🛒',
    Transport: '🚗',
    Unterhaltung: '🎬',
    Miete: '🏠',
    Versicherung: '🛡️',
    Gesundheit: '⚕️',
    Bildung: '📚',
    Sonstiges: '📌',
    Gehalt: '💼',
  };

  const emoji = categoryEmojis[category] || '💰';
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
    <div className="transaction-card animate-fade-in">
      <div className="transaction-card__left">
        <div className="transaction-card__avatar">{emoji}</div>
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
          ✏️
        </button>
        <button
          className="transaction-card__btn transaction-card__btn--delete"
          onClick={() => onDelete(id)}
          title="Löschen"
          aria-label={`Löschen: ${description}`}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default TransactionCard;
