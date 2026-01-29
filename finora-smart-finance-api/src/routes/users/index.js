// Aggregator für User Routes - Kombiniert alle User-bezogenen Routen
const express = require('express');
const router = express.Router();

const profileRoutes = require('./profileRoutes');
const passwordRoutes = require('./passwordRoutes');
const emailRoutes = require('./emailRoutes');
const preferencesRoutes = require('./preferencesRoutes');
const dataRoutes = require('./dataRoutes');
const budgetRoutes = require('./budgetRoutes');

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

module.exports = router;
