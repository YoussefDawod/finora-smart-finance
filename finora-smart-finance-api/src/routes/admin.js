const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { sanitizeUser, sanitizeUsers } = require('../utils/userSanitizer');
const {
  validateUserQuery,
  validateCreateUser,
  validateUpdateUser,
} = require('../validators/adminValidation');

function handleServerError(res, context, error) {
  logger.error(`${context} error:`, error);
  return res.status(500).json({ success: false, message: error.message });
}

// ⚠️ SECURITY: Diese Routen sind NUR für Development!
// In Production sollten sie deaktiviert oder mit Admin-Auth geschützt sein

const isDevelopment = process.env.NODE_ENV !== 'production';

// Middleware: Nur in Development verfügbar
router.use((req, res, next) => {
  if (!isDevelopment) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin endpoints are only available in development mode' 
    });
  }
  next();
});


// ============================================================================
// 📊 GET /api/admin/users - Alle Users auflisten
// ============================================================================
router.get('/users', async (req, res) => {
  try {
    const { errors, query, pagination, sort, showSensitive } = validateUserQuery(req.query || {});

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    const { page, limit, skip } = pagination;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const sanitizedUsers = sanitizeUsers(users, { includeSensitive: showSensitive });

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    handleServerError(res, 'Admin: Get users', error);
  }
});

// ============================================================================
// 🔍 GET /api/admin/users/:id - Einzelnen User abrufen
// ============================================================================
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Transaktionen des Users zählen
    const transactionCount = await Transaction.countDocuments({ userId: user._id });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user, { includeSensitive: true }), // Mit allen Feldern
        stats: {
          transactionCount,
          memberSince: user.createdAt,
          lastActivity: user.lastLogin || user.updatedAt
        }
      }
    });
  } catch (error) {
    handleServerError(res, 'Admin: Get user', error);
  }
});

// ============================================================================
// 📈 GET /api/admin/stats - Übersicht / Dashboard
// ============================================================================
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      usersLast7Days,
      usersLast30Days,
      totalTransactions,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      Transaction.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt lastLogin isVerified')
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          usersLast7Days,
          usersLast30Days,
          totalTransactions
        },
        recentUsers: sanitizeUsers(recentUsers)
      }
    });
  } catch (error) {
    handleServerError(res, 'Admin: Get stats', error);
  }
});

// ============================================================================
// ➕ POST /api/admin/users - Neuen User anlegen
// ============================================================================
router.post('/users', async (req, res) => {
  try {
    const { errors, data } = validateCreateUser(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    const existsByName = await User.findOne({ name: data.name });
    if (existsByName) {
      return res.status(409).json({ success: false, message: 'Name ist bereits vergeben' });
    }

    if (data.email) {
      const existsByEmail = await User.findOne({ email: data.email });
      if (existsByEmail) {
        return res.status(409).json({ success: false, message: 'E-Mail ist bereits vergeben' });
      }
    }

    const user = new User({
      name: data.name,
      email: data.email,
      passwordHash: data.password, // wird im Model via pre-save Hook gehasht
      isVerified: data.isVerified ?? false,
      lastName: data.lastName || '',
      phone: data.phone || null,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User erfolgreich erstellt',
      data: sanitizeUser(user),
    });
  } catch (error) {
    handleServerError(res, 'Admin: Create user', error);
  }
});

// ============================================================================
// ✏️ PATCH /api/admin/users/:id - User bearbeiten
// ============================================================================
router.patch('/users/:id', async (req, res) => {
  try {
    const { errors, updates } = validateUpdateUser(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validierungsfehler', errors });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    if (updates.email !== undefined && updates.email !== null) {
      const existsByEmail = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
      if (existsByEmail) {
        return res.status(409).json({ success: false, message: 'E-Mail ist bereits vergeben' });
      }
    }

    Object.assign(user, updates);
    await user.save();
    logger.info(`Admin: User ${user._id} updated`);

    res.json({
      success: true,
      message: 'User erfolgreich aktualisiert',
      data: sanitizeUser(user),
    });
  } catch (error) {
    handleServerError(res, 'Admin: Update user', error);
  }
});

// ============================================================================
// 🗑️ DELETE /api/admin/users/:id - User löschen
// ============================================================================
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Zuerst alle Transaktionen des Users löschen
    const deletedTransactions = await Transaction.deleteMany({ userId: user._id });
    
    // Dann den User löschen
    await User.findByIdAndDelete(req.params.id);
    
    logger.warn(`Admin: User ${user._id} deleted with ${deletedTransactions.deletedCount} transactions`);

    res.json({
      success: true,
      message: 'User und alle Transaktionen erfolgreich gelöscht',
      data: {
        deletedUser: user.name,
        deletedTransactions: deletedTransactions.deletedCount,
      },
    });
  } catch (error) {
    handleServerError(res, 'Admin: Delete user', error);
  }
});

// ============================================================================
// 🔄 POST /api/admin/users/:id/reset-password - Passwort zurücksetzen
// ============================================================================
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwort muss mindestens 6 Zeichen lang sein' 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Passwort wird automatisch gehasht durch pre-save Hook im Model
    user.passwordHash = newPassword;
    user.passwordChangedAt = new Date();
    user.lastPasswordChange = new Date();
    await user.save();

    logger.info(`Admin: Password reset for user ${user._id}`);

    res.json({
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt'
    });
  } catch (error) {
    handleServerError(res, 'Admin: Reset password', error);
  }
});

// ============================================================================
// 🧹 DELETE /api/admin/users - Alle Users löschen (VORSICHT!)
// ============================================================================
router.delete('/users', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_USERS') {
      return res.status(400).json({ 
        success: false, 
        message: 'Bitte bestätige mit confirm: "DELETE_ALL_USERS"' 
      });
    }

    const userCount = await User.countDocuments();
    const transactionCount = await Transaction.countDocuments();

    await Transaction.deleteMany({});
    await User.deleteMany({});

    logger.warn(`Admin: ALL USERS DELETED (${userCount} users, ${transactionCount} transactions)`);

    res.json({
      success: true,
      message: 'Alle Users und Transaktionen wurden gelöscht',
      data: {
        deletedUsers: userCount,
        deletedTransactions: transactionCount
      }
    });
  } catch (error) {
    handleServerError(res, 'Admin: Delete all users', error);
  }
});

module.exports = router;
