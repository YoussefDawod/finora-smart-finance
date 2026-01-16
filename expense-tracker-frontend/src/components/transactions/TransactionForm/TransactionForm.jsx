import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useTransactions } from '@/hooks/useTransactions';
import Select from '@/components/common/Select/Select';
import Input from '@/components/common/Input/Input';
import Textarea from '@/components/common/Textarea/Textarea';
import Button from '@/components/common/Button/Button';
import { z } from 'zod';
import styles from './TransactionForm.module.scss';

// ============================================================================
// VALIDIERUNGSSCHEMA (ZOD)
// ============================================================================
const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Typ ist erforderlich' }),
  }),
  amount: z
    .string()
    .min(1, 'Betrag ist erforderlich')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Betrag muss größer als 0 sein'
    ),
  category: z
    .string()
    .min(1, 'Kategorie ist erforderlich')
    .min(2, 'Kategorie muss mindestens 2 Zeichen lang sein'),
  description: z
    .string()
    .min(1, 'Beschreibung ist erforderlich')
    .min(3, 'Beschreibung muss mindestens 3 Zeichen lang sein')
    .max(100, 'Beschreibung darf maximal 100 Zeichen lang sein'),
  date: z
    .string()
    .min(1, 'Datum ist erforderlich')
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      'Ungültiges Datum'
    ),
});

// ============================================================================
// KATEGORIEN - MUSS MIT BACKEND SYNCHRON SEIN!
// ============================================================================
// Diese Kategorien MÜSSEN mit Backend ALLOWED_CATEGORIES übereinstimmen!
// Quelle: expense-tracker-backend/src/routes/transactions.js
const INCOME_CATEGORIES = ['Gehalt', 'Freelance', 'Investitionen', 'Geschenk', 'Sonstiges'];
const EXPENSE_CATEGORIES = ['Lebensmittel', 'Transport', 'Unterhaltung', 'Miete', 'Versicherung', 'Gesundheit', 'Bildung', 'Sonstiges'];

// ============================================================================
// KOMPONENTE
// ============================================================================
export const TransactionForm = ({ onSuccess, onCancel, initialData = null }) => {
  const [transactionType, setTransactionType] = useState(
    initialData?.type || 'expense'
  );
  const { createTransaction, updateTransaction, loading: apiLoading, error } = useTransactions();
  const { addToast } = useToast();

  // ──────────────────────────────────────────────────────────────────────
  // FORM HOOK
  // ──────────────────────────────────────────────────────────────────────
  const {
    values: formData,
    errors,
    handleChange,
    handleSubmit: onFormSubmit,
    resetForm,
    setFieldValue,
    isSubmitting: formSubmitting,
  } = useForm(
    {
      type: initialData?.type || 'expense',
      amount: initialData?.amount || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    },
    async (values) => {
      console.log('📝 [TransactionForm] Starting submit with values:', values);
      try {
        const submitData = {
          ...values,
          amount: parseFloat(values.amount),
        };

        if (initialData?.id) {
          console.log('📝 [TransactionForm] Updating transaction:', initialData.id);
          await updateTransaction(initialData.id, submitData);
          addToast('Transaktion aktualisiert', 'success');
        } else {
          console.log('📝 [TransactionForm] Creating new transaction');
          const result = await createTransaction(submitData);
          console.log('✅ [TransactionForm] Transaction created:', result);
          addToast('Transaktion erstellt', 'success');
        }

        console.log('📝 [TransactionForm] Resetting form and calling onSuccess');
        resetForm();
        onSuccess?.();
      } catch (err) {
        console.error('❌ [TransactionForm] Submit error:', err);
        // Don't show toast for 401/403 - the API client already handles this
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          addToast(err.response?.data?.message || 'Fehler beim Speichern', 'error');
        }
      }
    },
    transactionSchema
  );

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE TYPE CHANGE
  // ──────────────────────────────────────────────────────────────────────
  const handleTypeChange = useCallback((newType) => {
    setTransactionType(newType);
    setFieldValue('type', newType);
    setFieldValue('category', '');
  }, [setFieldValue]);

  // ──────────────────────────────────────────────────────────────────────
  // KATEGORIEN LISTE BASIEREND AUF TYP
  // ──────────────────────────────────────────────────────────────────────
  const categories =
    transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Kombinierte loading state
  const isLoading = apiLoading || formSubmitting;

  // ──────────────────────────────────────────────────────────────────────
  // ANIMATIONSVARIANTEN
  // ──────────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.form
      className={styles.form}
      onSubmit={onFormSubmit}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ERROR BANNER */}
      {error && (
        <motion.div
          className={styles.error}
          variants={itemVariants}
          role="alert"
        >
          <span>⚠️ {error}</span>
        </motion.div>
      )}

      {/* TYPE SELECTOR */}
      <motion.div className={styles.typeSelector} variants={itemVariants}>
        <label className={styles.label}>Typ</label>
        <div className={styles.typeButtons}>
          <motion.button
            type="button"
            className={`${styles.typeButton} ${
              transactionType === 'income' ? styles.active : ''
            } ${styles.income}`}
            onClick={() => handleTypeChange('income')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.icon}>💰</span>
            <span>Einnahme</span>
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.typeButton} ${
              transactionType === 'expense' ? styles.active : ''
            } ${styles.expense}`}
            onClick={() => handleTypeChange('expense')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.icon}>💸</span>
            <span>Ausgabe</span>
          </motion.button>
        </div>
      </motion.div>

      {/* AMOUNT INPUT */}
      <motion.div variants={itemVariants}>
        <Input
          label="Betrag (€)"
          id="amount"
          type="number"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) =>
            handleChange({
              target: { name: 'amount', value: e.target.value },
            })
          }
          error={errors.amount}
          required
          disabled={isLoading}
          size="medium"
          hint="Geben Sie den Betrag der Transaktion ein"
        />
      </motion.div>

      {/* CATEGORY SELECT */}
      <motion.div variants={itemVariants}>
        <Select
          label="Kategorie"
          options={categories.map((cat) => ({ value: cat, label: cat }))}
          placeholder="Wähle eine Kategorie"
          value={formData.category}
          onChange={(e) =>
            handleChange({
              target: { name: 'category', value: e.target.value },
            })
          }
          error={errors.category}
          required
          disabled={isLoading}
          size="medium"
          hint={`Wähle eine ${transactionType === 'income' ? 'Einnahme' : 'Ausgabe'}-Kategorie`}
        />
      </motion.div>

      {/* DATE INPUT */}
      <motion.div variants={itemVariants}>
        <Input
          label="Datum"
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) =>
            handleChange({
              target: { name: 'date', value: e.target.value },
            })
          }
          error={errors.date}
          required
          disabled={isLoading}
          size="medium"
          hint="Wählen Sie das Transaktionsdatum"
        />
      </motion.div>

      {/* DESCRIPTION TEXTAREA */}
      <motion.div variants={itemVariants}>
        <Textarea
          label="Beschreibung"
          id="description"
          placeholder="Beschreibe diese Transaktion..."
          value={formData.description}
          onChange={(e) =>
            handleChange({
              target: { name: 'description', value: e.target.value },
            })
          }
          error={errors.description}
          required
          disabled={isLoading}
          size="medium"
          rows={4}
          showCharCount
          maxLength={100}
          hint="Geben Sie Details zur Transaktion ein (max. 100 Zeichen)"
        />
      </motion.div>

      {/* BUTTONS */}
      <motion.div className={styles.actions} variants={itemVariants}>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={isLoading}
          loading={isLoading}
          fullWidth
        >
          {initialData?.id ? 'Aktualisieren' : 'Transaktion hinzufügen'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="medium"
            onClick={onCancel}
            disabled={isLoading}
            fullWidth
          >
            Abbrechen
          </Button>
        )}
      </motion.div>
    </motion.form>
  );
};

export default TransactionForm;
