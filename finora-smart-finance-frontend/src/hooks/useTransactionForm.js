/**
 * ============================================================================
 * USE TRANSACTION FORM HOOK
 * Extrahierte Form-Logik für TransactionForm Komponente
 * ============================================================================
 */
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { useTransactions } from '@/hooks/useTransactions';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/config/categoryConstants';
import {
  createTransactionSchema,
  getInitialFormValues,
} from '@/validators/transactionFormSchema';

/**
 * Custom Hook für Transaction Form State Management
 * @param {Object} options - Hook Optionen
 * @param {Object|null} options.initialData - Initiale Daten für Edit-Modus
 * @param {Function} options.onSuccess - Callback nach erfolgreichem Submit
 * @returns {Object} Form State und Handler
 */
export const useTransactionForm = ({ initialData = null, onSuccess }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const {
    createTransaction,
    updateTransaction,
    loading: apiLoading,
    error,
  } = useTransactions();

  // ──────────────────────────────────────────────────────────────────────
  // TRANSACTION TYPE STATE
  // ──────────────────────────────────────────────────────────────────────
  const [transactionType, setTransactionType] = useState(
    initialData?.type || 'expense'
  );

  // ──────────────────────────────────────────────────────────────────────
  // VALIDATION SCHEMA (memoized mit i18n)
  // ──────────────────────────────────────────────────────────────────────
  const transactionSchema = useMemo(
    () => createTransactionSchema(t),
    [t]
  );

  // ──────────────────────────────────────────────────────────────────────
  // FORM HOOK INTEGRATION
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
    getInitialFormValues(initialData),
    async (values) => {
      try {
        const submitData = {
          ...values,
          amount: parseFloat(values.amount),
        };

        if (initialData?.id) {
          await updateTransaction(initialData.id, submitData);
          addToast(t('transactions.updateSuccess'), 'success');
        } else {
          await createTransaction(submitData);
          addToast(t('transactions.createSuccess'), 'success');
        }

        resetForm();
        onSuccess?.();
      } catch (err) {
        console.error('❌ [TransactionForm] Submit error:', err);
        // Don't show toast for 401/403 - the API client already handles this
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          addToast(
            err.response?.data?.message || t('transactions.saveError'),
            'error'
          );
        }
      }
    },
    transactionSchema
  );

  // ──────────────────────────────────────────────────────────────────────
  // TYPE CHANGE HANDLER
  // ──────────────────────────────────────────────────────────────────────
  const handleTypeChange = useCallback(
    (newType) => {
      setTransactionType(newType);
      setFieldValue('type', newType);
      setFieldValue('category', ''); // Reset category when type changes
    },
    [setFieldValue]
  );

  // ──────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ──────────────────────────────────────────────────────────────────────
  const categories = useMemo(
    () => (transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [transactionType]
  );

  const isLoading = apiLoading || formSubmitting;

  // ──────────────────────────────────────────────────────────────────────
  // RETURN HOOK API
  // ──────────────────────────────────────────────────────────────────────
  return {
    // Form State
    formData,
    errors,
    transactionType,
    categories,
    isLoading,
    error,
    isEditMode: !!initialData?.id,

    // Handlers
    handleChange,
    handleTypeChange,
    onFormSubmit,
    resetForm,
    setFieldValue,
  };
};

export default useTransactionForm;
