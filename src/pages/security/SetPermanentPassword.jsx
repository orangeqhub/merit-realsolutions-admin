import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import PasswordInput from '../../components/auth/PasswordInput';
import { setPermanentPassword, getMustChangePassword } from '../../services/auth/authApi';
import { getAuthToken } from '../../services/auth/authStorage';
import { passwordsMatch, validatePasswordPolicy } from '../../utils/passwordValidation';
import '../../components/auth/PasswordInput.css';

export default function SetPermanentPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAuthToken()) navigate('/login', { replace: true });
    else if (!getMustChangePassword()) navigate('/dashboard', { replace: true });
  }, [navigate]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fieldErrors = useMemo(() => {
    const policy = validatePasswordPolicy(newPassword);
    return {
      newPassword: newPassword && !policy.valid ? policy.errors[0] : '',
      confirmPassword: confirmPassword && !passwordsMatch(newPassword, confirmPassword)
        ? 'Passwords do not match.'
        : '',
    };
  }, [newPassword, confirmPassword]);

  if (!getMustChangePassword()) {
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (currentPassword === newPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }
    if (!passwordsMatch(newPassword, confirmPassword)) {
      setError('New password and confirm password do not match.');
      return;
    }
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      setError(policy.errors[0]);
      return;
    }

    setLoading(true);
    try {
      await setPermanentPassword({ currentPassword, newPassword, confirmPassword });
      setSuccess('Password updated successfully.');
      setTimeout(() => navigate('/dashboard', { replace: true }), 900);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-setup-page">
      <div className="password-setup-card">
        <h2>Set Your Permanent Password</h2>
        <p>Create a secure password before accessing the admin dashboard.</p>

        {error ? <div className="password-alert password-alert--error">{error}</div> : null}
        {success ? <div className="password-alert password-alert--success">{success}</div> : null}

        <form onSubmit={submit}>
          <PasswordInput
            id="admin-current-password"
            label="Current Temporary Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            required
          />
          <PasswordInput
            id="admin-new-password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            showStrength
            error={fieldErrors.newPassword}
            disabled={loading}
            required
          />
          <PasswordInput
            id="admin-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            disabled={loading}
            required
          />

          <ul className="password-policy-list">
            <li>Minimum 8 characters with upper, lower, number, and special character</li>
          </ul>

          <Button type="submit" variant="gold" fullWidth disabled={loading}>
            {loading ? 'Saving…' : 'Save Permanent Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
