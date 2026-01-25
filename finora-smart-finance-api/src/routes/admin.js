const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

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

// Sensitive Fields entfernen (optional - für bessere Übersicht)
function sanitizeUser(user, showSensitive = false) {
  const obj = user.toObject();
  if (!showSensitive) {
    delete obj.passwordHash;
    delete obj.twoFactorSecret;
    delete obj.verificationToken;
    delete obj.verificationExpires;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    delete obj.emailChangeToken;
    delete obj.emailChangeNewEmail;
    delete obj.emailChangeExpires;
    delete obj.newEmailPending;
    delete obj.refreshTokens;
  }
  delete obj.__v;
  return obj;
}

// ============================================================================
// 📊 GET /api/admin/users - Alle Users auflisten
// ============================================================================
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      sortBy = 'createdAt',
      order = 'desc',
      isVerified,
      showSensitive = false 
    } = req.query;

    const query = {};
    
    // Suchfilter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Verifikationsfilter
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    const sanitizedUsers = users.map(u => sanitizeUser(u, showSensitive === 'true'));

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Admin: Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
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
        user: sanitizeUser(user, true), // Mit allen Feldern
        stats: {
          transactionCount,
          memberSince: user.createdAt,
          lastActivity: user.lastLogin || user.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Admin: Get user error:', error);
    res.status(500).json({ success: false, message: error.message });
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
        recentUsers: recentUsers.map(u => sanitizeUser(u))
      }
    });
  } catch (error) {
    logger.error('Admin: Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ➕ POST /api/admin/users - Neuen User anlegen
// ============================================================================
router.post('/users', async (req, res) => {
  try {
    const { name, password, email, isVerified = false, lastName, phone } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Felder name und password sind erforderlich'
      });
    }

    const existsByName = await User.findOne({ name });
    if (existsByName) {
      return res.status(409).json({ success: false, message: 'Name ist bereits vergeben' });
    }

    if (email) {
      const existsByEmail = await User.findOne({ email });
      if (existsByEmail) {
        return res.status(409).json({ success: false, message: 'E-Mail ist bereits vergeben' });
      }
    }

    const user = new User({
      name: name.trim(),
      email: email ? String(email).toLowerCase().trim() : undefined,
      passwordHash: password, // wird im Model via pre-save Hook gehasht
      isVerified: !!isVerified,
      lastName: lastName || '',
      phone: phone || null,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User erfolgreich erstellt',
      data: sanitizeUser(user)
    });
  } catch (error) {
    logger.error('Admin: Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ✏️ PATCH /api/admin/users/:id - User bearbeiten
// ============================================================================
router.patch('/users/:id', async (req, res) => {
  try {
    const { name, email, isVerified, lastName, phone } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User nicht gefunden' });
    }

    // Felder aktualisieren
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email || null;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    logger.info(`Admin: User ${user._id} updated`);

    res.json({
      success: true,
      message: 'User erfolgreich aktualisiert',
      data: sanitizeUser(user)
    });
  } catch (error) {
    logger.error('Admin: Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
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
        deletedTransactions: deletedTransactions.deletedCount
      }
    });
  } catch (error) {
    logger.error('Admin: Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
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
    logger.error('Admin: Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
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
    logger.error('Admin: Delete all users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
