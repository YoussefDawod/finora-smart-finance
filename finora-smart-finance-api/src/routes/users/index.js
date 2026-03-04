// Aggregator für User Routes - Kombiniert alle User-bezogenen Routen
const express = require('express');
const router = express.Router();
const { apiLimiter } = require('../../middleware/rateLimiter');

const profileRoutes = require('./profileRoutes');
const passwordRoutes = require('./passwordRoutes');
const emailRoutes = require('./emailRoutes');
const preferencesRoutes = require('./preferencesRoutes');
const dataRoutes = require('./dataRoutes');
const budgetRoutes = require('./budgetRoutes');
const lifecycleRoutes = require('./lifecycleRoutes');

// Globaler Rate Limiter für alle User-Routen
router.use(apiLimiter);

// Profile Routes (GET/PUT /me)
router.use('/', profileRoutes);

// Password Routes
router.use('/', passwordRoutes);

// Email Routes
router.use('/', emailRoutes);

// Preferences Routes
router.use('/', preferencesRoutes);

// Data Routes (Export, Delete)
router.use('/', dataRoutes);

// Budget Routes
router.use('/', budgetRoutes);

// Lifecycle Routes (Retention-Status, Export-Confirm)
router.use('/', lifecycleRoutes);

module.exports = router;
