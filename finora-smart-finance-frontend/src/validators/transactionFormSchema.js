/**
 * ============================================================================
 * TRANSACTION FORM VALIDATION SCHEMA
 * Zod Schema für Transaktionsformular-Validierung
 * ============================================================================
 */
import { z } from 'zod';

/**
 * Erstellt das Transaktions-Validierungsschema mit i18n-Unterstützung
 * @param {Function} t - i18n Translation Funktion
 * @returns {z.ZodObject} Zod Validierungsschema
 */
export const createTransactionSchema = (t) =>
  z.object({
    type: z.enum(['income', 'expense'], {
      errorMap: () => ({ message: t('transactions.validation.typeRequired') }),
    }),
    amount: z
      .string()
      .min(1, t('transactions.validation.amountRequired'))
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        t('transactions.validation.amountPositive')
      ),
    category: z
      .string()
      .min(1, t('transactions.validation.categoryRequired'))
      .min(2, t('transactions.validation.categoryMin')),
    description: z
      .string()
      .min(1, t('transactions.validation.descriptionRequired'))
      .min(3, t('transactions.validation.descriptionMin'))
      .max(100, t('transactions.validation.descriptionMax')),
    date: z
      .string()
      .min(1, t('transactions.validation.dateRequired'))
      .refine(
        (val) => !isNaN(new Date(val).getTime()),
        t('transactions.validation.invalidDate')
      ),
  });

/**
 * Standard-Werte für eine neue Transaktion
 * @param {Object} initialData - Optionale Initialdaten für Edit-Modus
 * @returns {Object} Form-Initialwerte
 */
export const getInitialFormValues = (initialData = null) => ({
  type: initialData?.type || 'expense',
  amount: initialData?.amount?.toString() || '',
  category: initialData?.category || '',
  description: initialData?.description || '',
  date: initialData?.date
    ? new Date(initialData.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
});
