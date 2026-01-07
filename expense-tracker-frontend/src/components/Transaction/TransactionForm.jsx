import React, { useState, useEffect, useId } from 'react';
import './TransactionForm.scss';

/**
 * TransactionForm - WCAG 2.1 Level AA konform
 * Props:
 *   - initialData: object | null (für Edit-Mode)
 *   - onSubmit: (data) => Promise<void>
 *   - onCancel: () => void
 *   - loading: boolean
 */
function TransactionForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const isEditMode = Boolean(initialData);
  
  // Unique IDs für A11y
  const typeId = useId();
  const amountId = useId();
  const categoryId = useId();
  const descriptionId = useId();
  const dateId = useId();

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Kategorien basierend auf Typ
  const categories = {
    expense: [
      'Lebensmittel',
      'Transport',
      'Unterhaltung',
      'Miete',
      'Versicherung',
      'Gesundheit',
      'Bildung',
      'Sonstiges',
    ],
    income: ['Gehalt', 'Freelance', 'Investitionen', 'Geschenk', 'Sonstiges'],
  };

  // Initialisierung im Edit-Mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'expense',
        amount: initialData.amount?.toString() || '',
        category: initialData.category || '',
        description: initialData.description || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData]);

  // Validierung
  const validate = (name, value) => {
    switch (name) {
      case 'amount':
        if (!value || value <= 0) return 'Betrag muss größer als 0 sein';
        if (isNaN(value)) return 'Betrag muss eine Zahl sein';
        return '';
      case 'category':
        if (!value) return 'Kategorie ist erforderlich';
        return '';
      case 'description':
        if (!value.trim()) return 'Beschreibung ist erforderlich';
        if (value.trim().length < 3) return 'Mindestens 3 Zeichen';
        return '';
      case 'date':
        if (!value) return 'Datum ist erforderlich';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Kategorie zurücksetzen wenn Typ wechselt
    if (name === 'type') {
      setFormData((prev) => ({
        ...prev,
        category: '',
      }));
    }

    // Live-Validierung wenn Feld bereits touched
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validate(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validate(name, value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Alle Felder als touched markieren
    const allTouched = {
      amount: true,
      category: true,
      description: true,
      date: true,
    };
    setTouched(allTouched);

    // Alle Felder validieren
    const newErrors = {
      amount: validate('amount', formData.amount),
      category: validate('category', formData.category),
      description: validate('description', formData.description),
      date: validate('date', formData.date),
    };
    setErrors(newErrors);

    // Prüfen ob Fehler vorhanden
    const hasErrors = Object.values(newErrors).some((error) => error !== '');
    if (hasErrors) return;

    // Submit
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit} noValidate aria-labelledby="form-title">
      <h3 id="form-title" className="sr-only">
        {isEditMode ? 'Transaktion bearbeiten' : 'Neue Transaktion erstellen'}
      </h3>

      {/* Typ (Einnahme/Ausgabe) */}
      <fieldset className="transaction-form__type-toggle">
        <legend className="sr-only">Transaktionstyp wählen</legend>
        <button
          type="button"
          className={`transaction-form__type-btn ${
            formData.type === 'expense' ? 'transaction-form__type-btn--active' : ''
          }`}
          onClick={() => setFormData((prev) => ({ ...prev, type: 'expense', category: '' }))}
          aria-pressed={formData.type === 'expense'}
          aria-label="Ausgabe auswählen"
        >
          💸 Ausgabe
        </button>
        <button
          type="button"
          className={`transaction-form__type-btn ${
            formData.type === 'income' ? 'transaction-form__type-btn--active' : ''
          }`}
          onClick={() => setFormData((prev) => ({ ...prev, type: 'income', category: '' }))}
          aria-pressed={formData.type === 'income'}
          aria-label="Einnahme auswählen"
        >
          💰 Einnahme
        </button>
      </fieldset>

      {/* Betrag */}
      <div className="form-group">
        <label htmlFor={amountId}>
          Betrag <span className="required" aria-label="erforderlich">*</span>
        </label>
        <div className="input-wrapper">
          <span className="input-prefix" aria-hidden="true">€</span>
          <input
            type="number"
            id={amountId}
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0.00"
            step="0.01"
            min="0"
            disabled={loading}
            className={errors.amount && touched.amount ? 'input-error' : ''}
            aria-invalid={errors.amount && touched.amount ? 'true' : 'false'}
            aria-describedby={errors.amount && touched.amount ? `${amountId}-error` : undefined}
            aria-required="true"
            autoComplete="off"
          />
        </div>
        {errors.amount && touched.amount && (
          <p id={`${amountId}-error`} className="form-error" role="alert">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Kategorie */}
      <div className="form-group">
        <label htmlFor={categoryId}>
          Kategorie <span className="required" aria-label="erforderlich">*</span>
        </label>
        <select
          id={categoryId}
          name="category"
          value={formData.category}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className={errors.category && touched.category ? 'input-error' : ''}
          aria-invalid={errors.category && touched.category ? 'true' : 'false'}
          aria-describedby={errors.category && touched.category ? `${categoryId}-error` : undefined}
          aria-required="true"
        >
          <option value="">Bitte wählen...</option>
          {categories[formData.type].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && touched.category && (
          <p id={`${categoryId}-error`} className="form-error" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      {/* Beschreibung */}
      <div className="form-group">
        <label htmlFor={descriptionId}>
          Beschreibung <span className="required" aria-label="erforderlich">*</span>
        </label>
        <input
          type="text"
          id={descriptionId}
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="z.B. Supermarkt Einkauf"
          disabled={loading}
          className={errors.description && touched.description ? 'input-error' : ''}
          aria-invalid={errors.description && touched.description ? 'true' : 'false'}
          aria-describedby={errors.description && touched.description ? `${descriptionId}-error` : undefined}
          aria-required="true"
          autoComplete="off"
        />
        {errors.description && touched.description && (
          <p id={`${descriptionId}-error`} className="form-error" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* Datum */}
      <div className="form-group">
        <label htmlFor={dateId}>
          Datum <span className="required" aria-label="erforderlich">*</span>
        </label>
        <input
          type="date"
          id={dateId}
          name="date"
          value={formData.date}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className={errors.date && touched.date ? 'input-error' : ''}
          aria-invalid={errors.date && touched.date ? 'true' : 'false'}
          aria-describedby={errors.date && touched.date ? `${dateId}-error` : undefined}
          aria-required="true"
        />
        {errors.date && touched.date && (
          <p id={`${dateId}-error`} className="form-error" role="alert">
            {errors.date}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="transaction-form__actions">
        <button 
          type="button" 
          className="btn btn--outline btn--full" 
          onClick={onCancel} 
          disabled={loading}
          aria-label="Formular abbrechen"
        >
          Abbrechen
        </button>
        <button 
          type="submit" 
          className="btn btn--primary btn--full" 
          disabled={loading}
          aria-label={loading ? 'Speichert...' : (isEditMode ? 'Transaktion aktualisieren' : 'Transaktion erstellen')}
        >
          {loading ? '⏳ Speichern...' : isEditMode ? '✓ Aktualisieren' : '✓ Erstellen'}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;
