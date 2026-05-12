const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  nom: { type: String },
  score: { type: Number, min: 0, max: 100 },
  statut: { type: String, enum: ['en_attente', 'validé', 'rejeté'], default: 'en_attente' },
}, { timestamps: true });

const investorSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  entreprise: { type: String, required: true, trim: true },
  initiales: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  telephone: { type: String },
  localisation: { type: String },
  type: {
    type: String,
    enum: ['VC', 'Business Angel', 'Accélérateur', 'Fonds Public', 'Corporate VC', 'Family Office'],
    required: true,
  },
  bio: { type: String },
  siteWeb: { type: String },
  secteurs: [{ type: String }],
  stades: [{ type: String }],
  ticketMin: { type: Number, default: 0 },   // en TND
  ticketMax: { type: Number, default: 0 },   // en TND
  portfolio: { type: Number, default: 0 },
  totalInvesti: { type: Number, default: 0 }, // en TND
  matches: [matchSchema],
  actif: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate initiales before save
investorSchema.pre('save', function (next) {
  if (!this.initiales && this.nom) {
    this.initiales = this.nom
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Investor', investorSchema);