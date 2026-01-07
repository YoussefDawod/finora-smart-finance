import { useState, useCallback } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import './ExpenseOperations.scss';

/**
 * CRUD Operations Komponente für Ausgaben
 * Features:
 *   - Create, Read, Update, Delete
 *   - Batch Selection & Deletion
 *   - Sync Queue Indicator
 *   - Optimistic Updates Visual
 */
export function ExpenseOperations() {
  const {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    deleteMultiple,
    updateExpense,
    syncQueue,
  } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'groceries',
    date: new Date().toISOString().split('T')[0],
  });

  // ============================================
  // FORM HANDLING
  // ============================================
  const resetForm = useCallback(() => {
    setFormData({
      description: '',
      amount: '',
      category: 'groceries',
      date: new Date().toISOString().split('T')[0],
    });
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }));
  }, []);

  // ============================================
  // CREATE
  // ============================================
  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.description || !formData.amount) return;

      try {
        await addExpense({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          type: 'expense',
        });
        resetForm();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Create failed:', error);
      }
    },
    [formData, addExpense, resetForm]
  );

  // ============================================
  // UPDATE
  // ============================================
  const handleEdit = useCallback((id) => {
    const expense = expenses.find((exp) => exp.id === id);
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        category: expense.category || 'groceries',
        date: expense.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
      setEditingId(id);
      setIsModalOpen(true);
    }
  }, [expenses]);

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.description || !formData.amount) return;

      try {
        await updateExpense(editingId, {
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
        });
        resetForm();
        setIsModalOpen(false);
        setEditingId(null);
      } catch (error) {
        console.error('Update failed:', error);
      }
    },
    [editingId, formData, updateExpense, resetForm]
  );

  // ============================================
  // DELETE (Single)
  // ============================================
  const handleDelete = useCallback(
    async (id) => {
      if (confirm('Bist du sicher, dass du diese Ausgabe löschen möchtest?')) {
        try {
          await deleteExpense(id);
        } catch (error) {
          console.error('Delete failed:', error);
        }
      }
    },
    [deleteExpense]
  );

  // ============================================
  // DELETE (Multiple)
  // ============================================
  const handleDeleteMultiple = useCallback(async () => {
    if (selectedIds.size === 0) return;

    if (
      confirm(
        `Bist du sicher, dass du ${selectedIds.size} Ausgaben löschen möchtest?`
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteMultiple(Array.from(selectedIds));
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Batch delete failed:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [selectedIds, deleteMultiple]);

  // ============================================
  // SELECTION
  // ============================================
  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map((exp) => exp.id)));
    }
  }, [expenses, selectedIds.size]);

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        Lädt...
      </div>
    );
  }

  return (
    <div className="expense-operations">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__left">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={selectedIds.size === expenses.length && expenses.length > 0}
              onChange={toggleSelectAll}
              aria-label="Alle Ausgaben auswählen"
            />
            <span>Alle auswählen</span>
          </label>
          {selectedIds.size > 0 && (
            <span className="toolbar__count" role="status">
              {selectedIds.size} ausgewählt
            </span>
          )}
        </div>

        <div className="toolbar__right">
          {selectedIds.size > 0 && (
            <button
              className="btn btn--danger"
              onClick={handleDeleteMultiple}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              🗑️ Löschen ({selectedIds.size})
            </button>
          )}

          <button
            className="btn btn--primary"
            onClick={() => {
              setEditingId(null);
              resetForm();
              setIsModalOpen(true);
            }}
          >
            ➕ Neue Ausgabe
          </button>
        </div>
      </div>

      {/* Sync Queue Indicator */}
      {syncQueue.length > 0 && (
        <div className="sync-queue-banner" role="alert">
          ⏳ {syncQueue.length} ausstehende Änderung(en)
        </div>
      )}

      {/* Expenses List with Selection */}
      {expenses.length === 0 ? (
        <div className="empty-state">
          <p>Keine Ausgaben vorhanden. Füge deine erste Ausgabe hinzu!</p>
        </div>
      ) : (
        <div className="expenses-list">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className={`expense-row ${
                selectedIds.has(expense.id) ? 'selected' : ''
              } ${expense._optimistic ? 'optimistic' : ''}`}
            >
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.has(expense.id)}
                  onChange={() => toggleSelection(expense.id)}
                  aria-label={`Wähle Ausgabe aus: ${expense.description}`}
                />
              </label>

              <div className="expense-info">
                <h3>{expense.description}</h3>
                <p>
                  {new Date(expense.date).toLocaleDateString('de-DE')} •{' '}
                  <span className="category-badge">{expense.category}</span>
                </p>
                {expense._optimistic && (
                  <span className="badge badge--optimistic">
                    Wird synchronisiert...
                  </span>
                )}
              </div>

              <div className="expense-amount">
                €{expense.amount?.toFixed(2) || '0.00'}
              </div>

              <div className="expense-actions">
                <button
                  className="btn btn--icon btn--secondary"
                  onClick={() => handleEdit(expense.id)}
                  aria-label={`Bearbeite Ausgabe: ${expense.description}`}
                  title="Bearbeiten"
                >
                  ✏️
                </button>

                <button
                  className="btn btn--icon btn--danger"
                  onClick={() => handleDelete(expense.id)}
                  aria-label={`Lösche Ausgabe: ${expense.description}`}
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>
                {editingId ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}
              </h2>
              <button
                className="btn btn--icon"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                aria-label="Modal schließen"
              >
                ✕
              </button>
            </div>

            <form className="modal__content" onSubmit={editingId ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label htmlFor="description">Beschreibung</label>
                <input
                  id="description"
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="z.B. Lebensmittel"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Betrag (€)</label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Kategorie</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                >
                  <option value="groceries">Lebensmittel</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Nebenkosten</option>
                  <option value="entertainment">Unterhaltung</option>
                  <option value="health">Gesundheit</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">Datum</label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingId ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
