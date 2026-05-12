// hooks/useAuthValidation.js
// ─────────────────────────────────────────────────────────────────
//  Hook de validation — email + password strength + champs métier
//
//  Usage :
//    const { errors, validate, validateField } = useAuthValidation();
//
//    // Valider un champ à la volée (onChange / onBlur)
//    validateField('email', value);
//
//    // Valider tout un formulaire avant soumission
//    const ok = validate(fields, 'founder'); // ou 'applicant'
//    if (!ok) return;
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

// ── Règles de force du mot de passe ─────────────────────────────
const PASSWORD_RULES = [
  { id: 'length',    label: 'Au moins 8 caractères',              test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'Une lettre majuscule',               test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Une lettre minuscule',               test: (p) => /[a-z]/.test(p) },
  { id: 'digit',     label: 'Un chiffre',                         test: (p) => /\d/.test(p) },
  { id: 'special',   label: 'Un caractère spécial (!@#$%…)',      test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const PASSWORD_STRENGTH_LABELS = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
export const PASSWORD_STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

/** Retourne le score de force (0–5) et les règles passées/échouées */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, rules: PASSWORD_RULES.map(r => ({ ...r, passed: false })) };
  const rules = PASSWORD_RULES.map(r => ({ ...r, passed: r.test(password) }));
  const score = rules.filter(r => r.passed).length;
  return { score, rules };
}

// ── Validators individuels ───────────────────────────────────────
const VALIDATORS = {
  name: (v) => {
    if (!v?.trim())         return 'Le nom complet est requis.';
    if (v.trim().length < 2) return 'Le nom doit comporter au moins 2 caractères.';
    if (!/\s/.test(v.trim())) return 'Veuillez entrer prénom ET nom.';
    return null;
  },

  email: (v) => {
    if (!v?.trim()) return 'L\'adresse email est requise.';
    // RFC 5322 simplifié
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()))
      return 'Adresse email invalide.';
    return null;
  },

  password: (v) => {
    if (!v) return 'Le mot de passe est requis.';
    if (v.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    const { score } = getPasswordStrength(v);
    if (score < 3) return 'Mot de passe trop faible. Ajoutez majuscules, chiffres ou symboles.';
    return null;
  },

  // ── Champs Fondateur ──
  startupName: (v) => {
    if (!v?.trim()) return 'Le nom de la startup est requis.';
    if (v.trim().length < 2) return 'Nom trop court.';
    return null;
  },

  uniqueId: (v) => {
    if (!v?.trim()) return 'L\'identifiant unique est requis.';
    // Accepte RNE tunisien (7 chiffres + lettre), SIRET (14 chiffres), ou format libre
    if (v.trim().length < 4) return 'Identifiant trop court.';
    return null;
  },

  sector: (v) => (!v ? 'Veuillez sélectionner un secteur d\'activité.' : null),
  stage:  (v) => (!v ? 'Veuillez sélectionner le stade du projet.' : null),

  website: (v) => {
    if (!v) return null; // optionnel
    try { new URL(v); return null; }
    catch { return 'URL invalide. Exemple : https://masite.tn'; }
  },

  linkedin: (v) => {
    if (!v) return null; // optionnel
    if (!/linkedin\.com\//i.test(v)) return 'L\'URL LinkedIn doit contenir linkedin.com';
    return null;
  },

  // ── Champs Candidat ──
  jobTitle: (v) => {
    if (!v?.trim()) return 'Le poste recherché est requis.';
    if (v.trim().length < 3) return 'Veuillez être plus précis.';
    return null;
  },

  experience: (v) => (!v ? 'Veuillez sélectionner votre niveau d\'expérience.' : null),

  skills: (v) => {
    if (!v) return null; // optionnel
    const list = v.split(',').filter(Boolean);
    if (list.length > 8) return 'Maximum 8 compétences.';
    return null;
  },
};

// ─────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────
export function useAuthValidation() {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /** Valide un champ unique — appelé onBlur ou onChange */
  const validateField = useCallback((field, value) => {
    const validator = VALIDATORS[field];
    if (!validator) return true;

    const error = validator(value);
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, []);

  /** Valide l'ensemble d'un formulaire.
   *  @param fields  — objet { fieldName: value }
   *  @param formType — 'login' | 'founder' | 'applicant'
   *  @returns true si valide, false sinon
   */
  const validate = useCallback((fields, formType = 'login') => {
    const fieldsToCheck = getFieldsForForm(formType);
    const newErrors = {};
    let isValid = true;

    fieldsToCheck.forEach(field => {
      const validator = VALIDATORS[field];
      if (!validator) return;
      const error = validator(fields[field]);
      if (error) { newErrors[field] = error; isValid = false; }
    });

    // Marquer tous les champs comme touchés
    const allTouched = fieldsToCheck.reduce((acc, f) => ({ ...acc, [f]: true }), {});
    setTouched(allTouched);
    setErrors(newErrors);

    return isValid;
  }, []);

  /** Réinitialise les erreurs (ex. au changement de formulaire) */
  const resetErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /** Retourne true si un champ a une erreur ET a été touché */
  const hasError = useCallback((field) => !!(touched[field] && errors[field]), [errors, touched]);

  return { errors, touched, validate, validateField, resetErrors, hasError };
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function getFieldsForForm(formType) {
  switch (formType) {
    case 'login':
      return ['email', 'password'];
    case 'founder':
      return ['name', 'email', 'password', 'startupName', 'uniqueId', 'sector', 'stage', 'website', 'linkedin'];
    case 'applicant':
      return ['name', 'email', 'password', 'jobTitle', 'experience', 'skills'];
    default:
      return ['email', 'password'];
  }
}


// ─────────────────────────────────────────────────────────────────
// Composant réutilisable : indicateur de force du mot de passe
// ─────────────────────────────────────────────────────────────────
// Usage dans un composant React :
//
//   import { PasswordStrengthIndicator } from '@/hooks/useAuthValidation';
//   <PasswordStrengthIndicator password={regPassword} />
//
export function PasswordStrengthIndicator({ password }) {
  const { score, rules } = getPasswordStrength(password);
  if (!password) return null;

  const label = PASSWORD_STRENGTH_LABELS[score];
  const color = PASSWORD_STRENGTH_COLORS[score];

  return (
    <div style={{ marginTop: '6px' }}>
      {/* Barre de force */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: i <= score ? color : '#e2e8f0',
              transition: 'background .3s ease',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '.62rem', color: '#94a3b8', fontWeight: 500 }}>
          Force du mot de passe
        </span>
        <span style={{ fontSize: '.62rem', fontWeight: 700, color }}>
          {label}
        </span>
      </div>

      {/* Règles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
        {rules.map(rule => (
          <div key={rule.id} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '.62rem', color: rule.passed ? '#10b981' : '#94a3b8',
            transition: 'color .2s',
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
              stroke={rule.passed ? '#10b981' : '#cbd5e1'} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              {rule.passed
                ? <polyline points="20 6 9 17 4 12" />
                : <circle cx="12" cy="12" r="10" />
              }
            </svg>
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}