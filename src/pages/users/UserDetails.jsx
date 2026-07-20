import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { useToast } from '../../components/feedback/Toast';
import { getUserById, ROLE_LABELS } from '../../services/users/userApi.js';

export default function UserDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserById(id)
      .then(setUser)
      .catch((err) => toast.error(err.message || 'Failed to load user.'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={user.name}
        description={ROLE_LABELS[user.role] || user.role}
        actions={(
          <>
            <Button variant="accent" to={`/dashboard/users/${id}/edit`}>Edit</Button>
            <Button variant="ghost" to="/dashboard/users">Back</Button>
          </>
        )}
      />

      <div className="partner-crm-panel">
        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>{user.status}</Badge>
        <dl style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem 1rem' }}>
          <dt>Employee Code</dt><dd>{user.employeeCode || '—'}</dd>
          <dt>Username</dt><dd>{user.username}</dd>
          <dt>Mobile</dt><dd>{user.mobile || '—'}</dd>
          <dt>Email</dt><dd>{user.email || '—'}</dd>
          <dt>Manager</dt><dd>{user.manager?.name || '—'}</dd>
          <dt>Created By</dt><dd>{user.creator ? `${user.creator.name} (${ROLE_LABELS[user.creator.role] || user.creator.role})` : '—'}</dd>
          <dt>City / State</dt><dd>{[user.city, user.state].filter(Boolean).join(', ') || '—'}</dd>
          <dt>Address</dt><dd>{user.address || '—'}</dd>
          <dt>Must Change Password</dt><dd>{user.mustChangePassword ? 'Yes' : 'No'}</dd>
          <dt>Created</dt><dd>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</dd>
        </dl>
        {user.role === 'CUSTOMER' && user.creator && (
          <p style={{ marginTop: '1rem' }}>
            Customer created by <strong>{user.creator.name}</strong>
            {user.creator.employeeCode ? ` (${user.creator.employeeCode})` : ''}.
          </p>
        )}
      </div>
    </motion.div>
  );
}
