import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { formContainerVariants, formItemVariants, buttonMotionProps } from '@/constants/animations';
import CategoryPicker from '@/components/transactions/CategoryPicker/CategoryPicker';
import Input from '@/components/common/Input/Input';
import Textarea from '@/components/common/Textarea/Textarea';
import Button from '@/components/common/Button/Button';
import { FiAlertCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import styles from './TransactionForm.module.scss';

// ============================================================================
// KOMPONENTE
// ============================================================================
export const TransactionForm = ({ onSuccess, onCancel, initialData = null }) => {
  const { t } = useTranslation();

  // ──────────────────────────────────────────────────────────────────────
  // FORM HOOK - Extrahierte Logik
  // ──────────────────────────────────────────────────────────────────────
  const {
    formData,
    errors,
    transactionType,
    categories,
    isLoading,
    error,
    isDirty,
    isEditMode,
    handleChange,
    handleTypeChange,
    onFormSubmit,
  } = useTransactionForm({ initialData, onSuccess });

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────
  return (
    <motion.form
      className={styles.form}
      onSubmit={onFormSubmit}
      variants={formContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ERROR BANNER */}
      {error && (
        <motion.div
          className={styles.error}
          variants={formItemVariants}
          role="alert"
        >
          <span><FiAlertCircle /> {error}</span>
        </motion.div>
      )}

      {/* TYPE SELECTOR */}
      <motion.div className={styles.typeSelector} variants={formItemVariants}>
        <label className={styles.label}>{t('transactions.type')}</label>
        <div className={styles.typeButtons}>
          <motion.button
            type="button"
            className={`${styles.typeButton} ${
              transactionType === 'income' ? styles.active : ''
            } ${styles.income}`}
            onClick={() => handleTypeChange('income')}
            {...buttonMotionProps}
          >
            <span className={styles.icon}><FiTrendingUp /></span>
            <span>{t('transactions.income')}</span>
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.typeButton} ${
              transactionType === 'expense' ? styles.active : ''
            } ${styles.expense}`}
            onClick={() => handleTypeChange('expense')}
            {...buttonMotionProps}
          >
            <span className={styles.icon}><FiTrendingDown /></span>
            <span>{t('transactions.expense')}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* AMOUNT INPUT */}
      <motion.div variants={formItemVariants}>
        <Input
          label={t('transactions.amount')}
          id="amount"
          type="number"
          placeholder={t('transactions.amountPlaceholder')}
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
          hint={t('transactions.amountHint')}
        />
      </motion.div>

      {/* CATEGORY PICKER */}
      <motion.div variants={formItemVariants}>
        <CategoryPicker
          categories={categories}
          value={formData.category}
          onChange={(e) =>
            handleChange({
              target: { name: 'category', value: e.target.value },
            })
          }
          label={t('transactions.category')}
          placeholder={t('transactions.categoryPlaceholder')}
          error={errors.category}
          required
          disabled={isLoading}
          size="medium"
          hint={t('transactions.categoryHint', {
            type: transactionType === 'income' ? t('transactions.income') : t('transactions.expense'),
          })}
        />
      </motion.div>

      {/* DATE INPUT */}
      <motion.div variants={formItemVariants}>
        <Input
          label={t('transactions.date')}
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
          hint={t('transactions.dateHint')}
        />
      </motion.div>

      {/* DESCRIPTION TEXTAREA */}
      <motion.div variants={formItemVariants}>
        <Textarea
          label={t('transactions.description')}
          id="description"
          placeholder={t('transactions.descriptionPlaceholder')}
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
          hint={t('transactions.descriptionHint')}
        />
      </motion.div>

      {/* BUTTONS */}
      <motion.div className={styles.actions} variants={formItemVariants}>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={isLoading || (isEditMode && !isDirty)}
          loading={isLoading}
          fullWidth
        >
          {isEditMode ? t('transactions.updateAction') : t('transactions.addTransaction')}
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
            {t('common.cancel')}
          </Button>
        )}
      </motion.div>
    </motion.form>
  );
};

export default TransactionForm;
