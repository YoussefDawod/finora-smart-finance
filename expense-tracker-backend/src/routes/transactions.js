// routes/transactions.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================
// ALLOWED CATEGORIES
// ============================================
const ALLOWED_CATEGORIES = [
  'Lebensmittel',
  'Transport',
  'Unterhaltung',
  'Miete',
  'Versicherung',
  'Gesundheit',
  'Bildung',
  'Sonstiges',
  'Gehalt',
  'Freelance',
  'Investitionen',
  'Geschenk',
];

// ============================================
// AUTHENTICATION MIDDLEWARE
// Alle Routes benötigen gültige JWT-Token
// Extrahiert userId aus req.user.id
// ============================================
router.use(authMiddleware);

// ============================================
// GET /api/transactions/stats/summary
// Zusammenfassung: Total Income, Total Expense, Balance
// WICHTIG: Muss VOR /:id Route stehen!
// FILTER: Nur eigene Transaktionen (userId)
// ============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert von authMiddleware
    const { startDate = '', endDate = '' } = req.query;

    const filter = { userId }; // USER-ISOLATION: Nur eigene Transaktionen

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime())) {
          filter.date.$lte = end;
        }
      }
    }

    // Aggregation für schnellere Berechnung
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || {
      totalIncome: 0,
      totalExpense: 0,
      transactionCount: 0,
    };

    const balance = result.totalIncome - result.totalExpense;

    res.json({
      success: true,
      data: {
        totalIncome: parseFloat(result.totalIncome.toFixed(2)),
        totalExpense: parseFloat(result.totalExpense.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        transactionCount: result.transactionCount,
      },
    });
  } catch (error) {
    console.error('GET /api/transactions/stats/summary Error:', error);
    res.status(500).json({
      error: 'Fehler beim Berechnen der Zusammenfassung',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

// ============================================
// POST /api/transactions - Neue Transaktion
// userId wird AUTOMATISCH aus JWT gesetzt
// ============================================
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert
    const { amount, category, description, type, date, tags, notes } = req.body;

    // Validierung
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Amount ist erforderlich und muss > 0 sein',
        code: 'INVALID_AMOUNT',
      });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: 'Ungültige oder fehlende Category',
        code: 'INVALID_CATEGORY',
      });
    }

    if (!description || description.trim().length < 3) {
      return res.status(400).json({
        error: 'Description ist erforderlich (min. 3 Zeichen)',
        code: 'INVALID_DESCRIPTION',
      });
    }

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: 'Type muss "income" oder "expense" sein',
        code: 'INVALID_TYPE',
      });
    }

    if (!date) {
      return res.status(400).json({
        error: 'Date ist erforderlich (Format: YYYY-MM-DD)',
        code: 'INVALID_DATE',
      });
    }

    // Datum validieren
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Ungültiges Datum-Format. Nutze YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    // Transaktion erstellen mit automatischem userId
    const transaction = await Transaction.create({
      userId, // USER-ISOLATION: Automatisch aus JWT gesetzt
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      type,
      date: parsedDate,
      tags: tags || [],
      notes: notes || null,
    });

    // Response mit 201 Created
    res.status(201).json({
      success: true,
      data: transaction.toJSON(),
      message: 'Transaktion erstellt',
    });
  } catch (error) {
    console.error('POST /api/transactions Error:', error);

    // Mongoose Validierungsfehler
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: messages,
        code: 'VALIDATION_ERROR',
      });
    }

    // Generischer Fehler
    res.status(500).json({
      error: 'Fehler beim Erstellen der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

// ============================================
// GET /api/transactions - Alle Transaktionen (nur eigene)
// Query Params:
//   - page: Seite (default: 1)
//   - limit: Items pro Seite (default: 10, max: 100)
//   - type: 'income' | 'expense' | ''
//   - category: Kategorie (z.B. 'Lebensmittel')
//   - startDate: Von Datum (YYYY-MM-DD)
//   - endDate: Bis Datum (YYYY-MM-DD)
//   - sort: 'date' (default) | 'amount'
//   - order: 'asc' | 'desc' (default)
// FILTER: { userId: req.user.id }
// ============================================
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert
    const {
      page = 1,
      limit = 10,
      type = '',
      category = '',
      startDate = '',
      endDate = '',
      sort = 'date',
      order = 'desc',
    } = req.query;

    // Validierung
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Filter bauen - IMPORTANT: userId IMMER mitfiltern
    const filter = { userId }; // USER-ISOLATION

    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    // Datums-Range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ende des Tages
        if (!isNaN(end.getTime())) {
          filter.date.$lte = end;
        }
      }
    }

    // Sortierung
    const sortObj = {};
    if (sort === 'amount') {
      sortObj.amount = order === 'asc' ? 1 : -1;
    } else {
      sortObj.date = order === 'asc' ? 1 : -1;
    }

    // Query ausführen
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Response
    res.json({
      success: true,
      data: transactions.map((t) => t.toJSON()),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('GET /api/transactions Error:', error);
    res.status(500).json({
      error: 'Fehler beim Abrufen der Transaktionen',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

// ============================================
// GET /api/transactions/:id - Eine Transaktion
// OWNER-CHECK: Prüfe ob transaction.userId === req.user.id
// 403 Forbidden wenn nicht Owner
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert
    const { id } = req.params;

    // MongoDB ObjectId validieren
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Ungültige Transaktion ID',
        code: 'INVALID_ID',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaktion nicht gefunden',
        code: 'NOT_FOUND',
      });
    }

    // OWNER-CHECK: Nur der Owner kann die Transaktion sehen
    if (transaction.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Sie haben keine Berechtigung, diese Transaktion zu sehen',
        code: 'FORBIDDEN',
      });
    }

    res.json({
      success: true,
      data: transaction.toJSON(),
    });
  } catch (error) {
    console.error('GET /api/transactions/:id Error:', error);
    res.status(500).json({
      error: 'Fehler beim Abrufen der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

// ============================================
// PUT /api/transactions/:id - Transaktion updaten
// OWNER-CHECK: Prüfe ob transaction.userId === req.user.id
// 403 Forbidden wenn nicht Owner
// Body: { amount?, category?, description?, type?, date?, tags?, notes? }
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert
    const { id } = req.params;
    const { amount, category, description, type, date, tags, notes } = req.body;

    // ID validieren
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Ungültige Transaktion ID',
        code: 'INVALID_ID',
      });
    }

    // Transaktion finden
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaktion nicht gefunden',
        code: 'NOT_FOUND',
      });
    }

    // OWNER-CHECK: Nur der Owner kann die Transaktion updaten
    if (transaction.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Sie haben keine Berechtigung, diese Transaktion zu ändern',
        code: 'FORBIDDEN',
      });
    }

    // Update-Felder validieren und setzen
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          error: 'Amount muss > 0 sein',
          code: 'INVALID_AMOUNT',
        });
      }
      transaction.amount = parseFloat(amount);
    }

    if (category !== undefined) {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: 'Ungültige Category',
          code: 'INVALID_CATEGORY',
        });
      }
      transaction.category = category;
    }

    if (description !== undefined) {
      if (description.trim().length < 3) {
        return res.status(400).json({
          error: 'Description muss mindestens 3 Zeichen lang sein',
          code: 'INVALID_DESCRIPTION',
        });
      }
      transaction.description = description.trim();
    }

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          error: 'Type muss "income" oder "expense" sein',
          code: 'INVALID_TYPE',
        });
      }
      transaction.type = type;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Ungültiges Datum-Format. Nutze YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT',
        });
      }
      transaction.date = parsedDate;
    }

    if (tags !== undefined) {
      transaction.tags = Array.isArray(tags) ? tags : [];
    }

    if (notes !== undefined) {
      transaction.notes = notes || null;
    }

    // Speichern
    await transaction.save();

    res.json({
      success: true,
      data: transaction.toJSON(),
      message: 'Transaktion aktualisiert',
    });
  } catch (error) {
    console.error('PUT /api/transactions/:id Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: messages,
        code: 'VALIDATION_ERROR',
      });
    }

    res.status(500).json({
      error: 'Fehler beim Aktualisieren der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

// ============================================
// DELETE /api/transactions/:id - Transaktion löschen
// OWNER-CHECK: Prüfe ob transaction.userId === req.user.id
// 403 Forbidden wenn nicht Owner
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert
    const { id } = req.params;

    // ID validieren
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Ungültige Transaktion ID',
        code: 'INVALID_ID',
      });
    }

    // Transaktion finden
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaktion nicht gefunden',
        code: 'NOT_FOUND',
      });
    }

    // OWNER-CHECK: Nur der Owner kann die Transaktion löschen
    if (transaction.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Sie haben keine Berechtigung, diese Transaktion zu löschen',
        code: 'FORBIDDEN',
      });
    }

    // Transaktion löschen
    await Transaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Transaktion gelöscht',
      data: {
        id: transaction._id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('DELETE /api/transactions/:id Error:', error);
    res.status(500).json({
      error: 'Fehler beim Löschen der Transaktion',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

// ============================================
// DELETE /api/transactions - Alle Transaktionen löschen (BULK)
// Nur EIGENE Transaktionen löschen (userId-Filter)
// Query Param: confirm=true (Sicherheit)
// ============================================
router.delete('/', async (req, res) => {
  try {
    const userId = req.user._id; // Aus JWT extrahiert
    const { confirm } = req.query;

    if (confirm !== 'true') {
      return res.status(400).json({
        error: 'Sicherheitsbestätigung erforderlich: ?confirm=true',
        code: 'MISSING_CONFIRMATION',
      });
    }

    // USER-ISOLATION: Nur eigene Transaktionen löschen
    const result = await Transaction.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Alle eigenen Transaktionen gelöscht',
      data: {
        deletedCount: result.deletedCount,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('DELETE /api/transactions Error:', error);
    res.status(500).json({
      error: 'Fehler beim Löschen aller Transaktionen',
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

module.exports = router;
