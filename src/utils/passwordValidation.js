const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function validatePasswordPolicy(password) {
  const errors = [];
  const value = String(password || '');

  if (value.length < 8) errors.push('Password must be at least 8 characters.');
  if (!/[A-Z]/.test(value)) errors.push('Include at least one uppercase letter.');
  if (!/[a-z]/.test(value)) errors.push('Include at least one lowercase letter.');
  if (!/\d/.test(value)) errors.push('Include at least one number.');
  if (!SPECIAL_CHARS.test(value)) errors.push('Include at least one special character.');

  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(password) {
  const value = String(password || '');
  if (!value) return { score: 0, label: 'Empty', percent: 0 };

  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value)) score += 1;

  const capped = Math.min(score, 5);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { score: capped, label: labels[capped], percent: (capped / 5) * 100 };
}

export function passwordsMatch(a, b) {
  return String(a || '') === String(b || '') && String(a || '').length > 0;
}
