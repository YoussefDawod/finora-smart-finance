// models/Transaction.js
const mongoose = require('mongoose');

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

    // Nur für zukünftige Features
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Wird später required
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatisch
    toJSON: { virtuals: true }, // Virtuelle Felder in JSON
    toObject: { virtuals: true },
  }
);

// Indexes für Performance
transactionSchema.index({ date: -1 }); // Neueste zuerst
transactionSchema.index({ category: 1, date: -1 }); // Category + Datum
transactionSchema.index({ type: 1, date: -1 }); // Type + Datum

// Virtual: Formatierte Ausgabe
transactionSchema.virtual('formattedAmount').get(function () {
  return `€${this.amount.toFixed(2)}`;
});

// Pre-save Hook: Validierung (async/await statt next())
transactionSchema.pre('save', async function () {
  // Weitere Geschäftslogik hier
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
