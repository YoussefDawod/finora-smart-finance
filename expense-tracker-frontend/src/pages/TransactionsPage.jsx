/**
 * @fileoverview TransactionsPage Component
 * @description Seite zur Anzeige und Verwaltung von Transaktionen
 * 
 * FEATURES:
 * - Search & Filter Controls (oben)
 * - Transaktionsliste mit Pagination
 * - Add/Edit/Delete Transactions
 * 
 * @module pages/TransactionsPage
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/hooks/useTransactions';
import Button from '@/components/common/Button/Button';
import TransactionList from '@/components/transactions/TransactionList/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm/TransactionForm';
import { FiPlus } from 'react-icons/fi';
import styles from './TransactionsPage.module.scss';

const TransactionsPage = () => {
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE EDIT
  // ──────────────────────────────────────────────────────────────────────
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE SUCCESS
  // ──────────────────────────────────────────────────────────────────────
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  // ──────────────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className={styles.transactionsPage}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div className={styles.header} variants={itemVariants}>
        <div>
          <h1>Transaktionen</h1>
          <p>Verwalte deine Einnahmen und Ausgaben</p>
        </div>
        <Button
          variant="primary"
          size="medium"
          icon={<FiPlus />}
          onClick={() => {
            setEditingTransaction(null);
            setShowForm(!showForm);
          }}
          aria-label="Transaktion hinzufügen"
        />
      </motion.div>

      {/* FORM SECTION (wenn geöffnet) */}
      {showForm && (
        <motion.div
          className={styles.formSection}
          variants={itemVariants}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TransactionForm
            initialData={editingTransaction}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingTransaction(null);
            }}
          />
        </motion.div>
      )}

      {/* TRANSACTIONS LIST SECTION */}
      <motion.div className={styles.contentSection} variants={itemVariants}>
        <TransactionList onEdit={handleEdit} pageSize={15} />
      </motion.div>
    </motion.div>
  );
};

export default TransactionsPage;
