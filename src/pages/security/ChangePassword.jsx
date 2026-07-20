import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import PasswordInput from '../../components/auth/PasswordInput';
import { useToast } from '../../components/feedback/Toast';
import { changeAdminPassword } from '../../services/auth/authApi';
import { clearSession } from '../../services/auth/authStorage';
import { passwordsMatch, validatePasswordPolicy } from '../../utils/passwordValidation';
import '../../components/auth/PasswordInput.css';

export default function ChangePassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fieldErrors = useMemo(() => {
    const policy = validatePasswordPolicy(newPassword);
    return {
      newPassword: newPassword && !policy.valid ? policy.errors[0] : '',
      confirmPassword: confirmPassword && !passwordsMatch(newPassword, confirmPassword)
        ? 'Passwords do not match.'
        : '',
    };
  }, [newPassword, confirmPassword]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
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
      await changeAdminPassword({ currentPassword, newPassword, confirmPassword });
      toast.success('Password changed successfully.');
      clearSession();
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" subtitle="Security settings for your admin account." />
      <div className="card" style={{ maxWidth: 560 }}>
        {error ? <div className="password-alert password-alert--error">{error}</div> : null}
        <form onSubmit={submit}>
          <PasswordInput
            id="change-current"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            required
          />
          <PasswordInput
            id="change-new"
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
            id="change-confirm"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            disabled={loading}
            required
          />
          <Button type="submit" variant="gold" disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
