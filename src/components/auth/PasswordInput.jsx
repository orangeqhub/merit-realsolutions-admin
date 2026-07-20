import { useState } from 'react';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import './PasswordInput.css';

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  disabled = false,
  showStrength = false,
  error,
  required = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group form-group--light password-input-field">
      {label ? <label htmlFor={id}>{label}{required ? ' *' : ''}</label> : null}
      <div className="password-input-field__wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
        />
        <button
          type="button"
          className="password-input-field__toggle"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {showStrength ? <PasswordStrengthMeter password={value} /> : null}
      {error ? <p className="password-input-field__error">{error}</p> : null}
    </div>
  );
}
