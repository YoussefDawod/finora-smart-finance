/**
 * API v1 Router
 * Bündelt alle Subroutes unter /api/v1
 */

const { Router } = require('express');

const transactionRoutes = require('./transactions');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const contactRoutes = require('./contact');
const newsletterRoutes = require('./newsletter');
const feedbackRoutes = require('./feedback');

const router = Router();

router.use('/transactions', transactionRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/feedback', feedbackRoutes);

module.exports = router;
