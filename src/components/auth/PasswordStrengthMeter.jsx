import { getPasswordStrength } from '../../utils/passwordValidation';
import './PasswordInput.css';

export default function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  const tone = ['weak', 'weak', 'fair', 'good', 'strong', 'strong'][strength.score] || 'weak';

  return (
    <div className="password-strength-meter" aria-live="polite">
      <div className="password-strength-meter__track">
        <div
          className={`password-strength-meter__bar password-strength-meter__bar--${tone}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      <span>{strength.label}</span>
    </div>
  );
}
