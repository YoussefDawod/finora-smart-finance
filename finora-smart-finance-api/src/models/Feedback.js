/**
 * Feedback Model
 * User-Bewertungen mit optionalem Consent zur öffentlichen Anzeige
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ist erforderlich'],
    },
    rating: {
      type: Number,
      required: [true, 'Bewertung ist erforderlich'],
      min: [1, 'Bewertung muss mindestens 1 sein'],
      max: [5, 'Bewertung darf maximal 5 sein'],
    },
    text: {
      type: String,
      default: '',
      maxlength: [1000, 'Feedback-Text darf maximal 1000 Zeichen haben'],
      trim: true,
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
    // Benutzername für öffentliche Anzeige (wird beim Erstellen gesetzt)
    displayName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pro User nur ein Feedback erlaubt
feedbackSchema.index({ user: 1 }, { unique: true });

// Für öffentliche Abfragen: nur veröffentlichte Feedbacks
feedbackSchema.index({ published: 1, rating: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
