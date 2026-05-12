// src/middlewares/passwordValidator.js
const passwordStrength = (password) => {
  let score = 0;
  
  // Critères de force
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (/^\S*$/.test(password)) score++;
  
  // Évaluation
  if (score <= 3) return 'weak';
  if (score <= 5) return 'medium';
  if (score <= 7) return 'strong';
  return 'very-strong';
};

const validatePassword = (password) => {
  const checks = [
    { test: /.{8,}/, message: 'Minimum 8 caractères', level: 'error' },
    { test: /.{12,}/, message: 'Idéalement 12 caractères ou plus', level: 'warning' },
    { test: /[A-Z]/, message: 'Au moins une majuscule', level: 'error' },
    { test: /[a-z]/, message: 'Au moins une minuscule', level: 'error' },
    { test: /[0-9]/, message: 'Au moins un chiffre', level: 'error' },
    { test: /[!@#$%^&*(),.?":{}|<>]/, message: 'Au moins un caractère spécial', level: 'error' },
    { test: /^\S*$/, message: 'Ne doit pas contenir d\'espaces', level: 'error' },
    { test: /^(?!.*(.)\1{2})/, message: 'Évitez les répétitions (ex: aaa)', level: 'warning' },
    { test: /^(?!.*(?:123|abc|qwerty|password))/i, message: 'Évitez les mots de passe communs', level: 'warning' }
  ];
  
  const errors = checks
    .filter(check => !check.test.test(password) && check.level === 'error')
    .map(check => check.message);
  
  const warnings = checks
    .filter(check => !check.test.test(password) && check.level === 'warning')
    .map(check => check.message);
  
  const strength = passwordStrength(password);
  
  return { 
    isValid: errors.length === 0,
    errors,
    warnings,
    strength,
    score: strength === 'weak' ? 0 : strength === 'medium' ? 1 : strength === 'strong' ? 2 : 3
  };
};

module.exports = { validatePassword, passwordStrength };