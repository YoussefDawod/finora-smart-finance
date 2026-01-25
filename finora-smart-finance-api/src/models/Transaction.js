// models/Transaction.js
const mongoose = require('mongoose');
const User = require('./User');

const transactionSchema = new mongoose.Schema(
  {
    // Basis-Felder
    amount: {
      type: Number,
      required: [true, 'Amount ist erforderlich'],
      min: [0.01, 'Amount muss > 0 sein'],
      max: [1000000, 'Amount darf 1.000.000 nicht überschreiten'],
      set: (v) => parseFloat(v.toFixed(2)), // 2 Dezimalstellen
    },

    category: {
      type: String,
      enum: [
        // Ausgaben (Expenses)
        'Lebensmittel',
        'Transport',
        'Unterhaltung',
        'Miete',
        'Versicherung',
        'Gesundheit',
        'Bildung',
        'Kleidung',
        'Reisen',
        'Elektronik',
        'Restaurant',
        'Sport',
        'Haushalt',
        'Sonstiges',
        // Einnahmen (Income)
        'Gehalt',
        'Freelance',
        'Investitionen',
        'Geschenk',
        'Bonus',
        'Nebenjob',
        'Cashback',
        'Vermietung',
      ],
      required: [true, 'Category ist erforderlich'],
      index: true, // Schnellere Queries
    },

    description: {
      type: String,
      required: [true, 'Description ist erforderlich'],
      trim: true,
      minlength: [3, 'Description muss mindestens 3 Zeichen lang sein'],
      maxlength: [255, 'Description darf 255 Zeichen nicht überschreiten'],
    },

    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      default: 'expense',
      index: true,
    },

    date: {
      type: Date,
      required: [true, 'Date ist erforderlich'],
      index: true,
    },

    // Metadata
    tags: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      maxlength: [500, 'Notes darf 500 Zeichen nicht überschreiten'],
    },

    // User Reference für User-Isolation
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId ist erforderlich'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatisch
    toJSON: { virtuals: true }, // Virtuelle Felder in JSON
    toObject: { virtuals: true },
  }
);

// Indexes für Performance
transactionSchema.index({ userId: 1 }); // USER-ISOLATION: Schnelle User-Queries
transactionSchema.index({ userId: 1, date: -1 }); // User + Datum (häufig)
transactionSchema.index({ userId: 1, type: 1, date: -1 }); // User + Type + Datum
transactionSchema.index({ userId: 1, category: 1, date: -1 }); // User + Category + Datum
transactionSchema.index({ date: -1 }); // Neueste zuerst
transactionSchema.index({ category: 1, date: -1 }); // Category + Datum
transactionSchema.index({ type: 1, date: -1 }); // Type + Datum

// VOLLTEXT-SUCHE: Text-Index für description und category
// Ermöglicht effiziente Suche mit $text Operator
transactionSchema.index({ 
  description: 'text', 
  category: 'text' 
}, {
  weights: {
    description: 2,  // Beschreibung wichtiger
    category: 1
  },
  name: 'transaction_text_index'
});

// Virtual: Formatierte Ausgabe
transactionSchema.virtual('formattedAmount').get(function () {
  return `€${this.amount.toFixed(2)}`;
});

// Pre-validate Hook: Sicherstellen, dass userId auf existierenden User zeigt
transactionSchema.pre('validate', async function () {
  if (!this.isModified('userId')) return;

  const userExists = await User.exists({ _id: this.userId });
  if (!userExists) {
    throw new Error('userId verweist auf keinen bestehenden User');
  }
});

// Statics: Hilfsmethoden
transactionSchema.statics.findByCategory = function (category) {
  return this.find({ category });
};

transactionSchema.statics.getExpenses = function () {
  return this.find({ type: 'expense' });
};

transactionSchema.statics.getIncome = function () {
  return this.find({ type: 'income' });
};

// Methods: Instanz-Methoden
transactionSchema.methods.toJSON = function () {
  return {
    id: this._id,
    userId: this.userId,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    category: this.category,
    description: this.description,
    type: this.type,
    date: this.date.toISOString().split('T')[0], // YYYY-MM-DD
    tags: this.tags,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
