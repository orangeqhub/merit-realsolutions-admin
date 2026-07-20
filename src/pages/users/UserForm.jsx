import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import { useToast } from '../../components/feedback/Toast';
import {
  createUser,
  updateUser,
  getUserById,
  listUsers,
  resetUserPassword,
  ROLE_LABELS,
  USER_ROLES,
} from '../../services/users/userApi.js';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default function UserForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    role: searchParams.get('role') || USER_ROLES.AREA_BUSINESS_PARTNER,
    managerId: '',
    areaId: '',
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    getUserById(id)
      .then((user) => {
        setForm({
          name: user.name || '',
          mobile: user.mobile || '',
          email: user.email || '',
          role: user.role,
          managerId: user.managerId ? String(user.managerId) : '',
          areaId: user.areaId ? String(user.areaId) : '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
        });
      })
      .catch((err) => toast.error(err.message || 'Failed to load user.'))
      .finally(() => setLoading(false));
  }, [id, isEdit, toast]);

  useEffect(() => {
    const managerRole = form.role === USER_ROLES.AREA_BUSINESS_COORDINATOR
      ? USER_ROLES.AREA_BUSINESS_PARTNER
      : form.role === USER_ROLES.AREA_BUSINESS_EXECUTIVE
        ? USER_ROLES.AREA_BUSINESS_COORDINATOR
        : null;
    if (!managerRole) {
      setManagers([]);
      return;
    }
    listUsers({ role: managerRole, limit: 100 })
      .then((data) => setManagers(data.items || []))
      .catch(() => setManagers([]));
  }, [form.role]);

  const managerOptions = useMemo(
    () => managers.map((m) => ({
      value: String(m.id),
      label: `${m.name}${m.employeeCode ? ` (${m.employeeCode})` : ''}`,
    })),
    [managers]
  );

  const needsManager = [USER_ROLES.AREA_BUSINESS_COORDINATOR, USER_ROLES.AREA_BUSINESS_EXECUTIVE].includes(form.role);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        managerId: form.managerId ? Number(form.managerId) : null,
        areaId: form.areaId ? Number(form.areaId) : null,
      };
      if (isEdit) {
        await updateUser(id, payload);
        toast.success('User updated.');
        navigate(`/dashboard/users/${id}`);
      } else {
        const created = await createUser(payload);
        if (created.credentials) setCredentials(created.credentials);
        toast.success('User created.');
        if (!created.credentials) navigate('/dashboard/users');
      }
    } catch (err) {
      const detail = err.errors?.length
        ? err.errors.map((e) => e.message || `${e.field}: invalid`).join('. ')
        : null;
      toast.error(detail || err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = credentials.whatsAppMessage || `Username: ${credentials.username}\nPassword: ${credentials.temporaryPassword}`;
    await navigator.clipboard.writeText(text);
    toast.success('Credentials copied.');
  };

  const handleResetPassword = async () => {
    try {
      const data = await resetUserPassword(id);
      setCredentials(data.credentials);
      toast.success('Password reset.');
    } catch (err) {
      toast.error(err.message || 'Reset failed.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Create User'}
        description="Employee credentials (code, username, temp password) are auto-generated for sales roles."
        actions={isEdit && (
          <Button variant="outline" onClick={handleResetPassword}>Reset Password</Button>
        )}
      />

      {credentials && (
        <div className="partner-crm-panel" style={{ marginBottom: '1rem' }}>
          <h3>Generated Credentials</h3>
          <p><strong>Username:</strong> {credentials.username}</p>
          {credentials.employeeCode && <p><strong>Employee Code:</strong> {credentials.employeeCode}</p>}
          <p><strong>Temporary Password:</strong> {credentials.temporaryPassword}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Button variant="accent" size="sm" onClick={copyCredentials}>Copy Credentials</Button>
            <Button variant="outline" size="sm" onClick={() => toast.success('WhatsApp integration will be connected here.')}>WhatsApp Credentials</Button>
            <Button variant="ghost" size="sm" to="/dashboard/users">Done</Button>
          </div>
        </div>
      )}

      {!credentials && (
        <form onSubmit={submit} className="partner-crm-form-grid" style={{ maxWidth: 720 }}>
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Select label="Role" required value={form.role} onChange={(v) => setForm((p) => ({ ...p, role: v, managerId: '' }))} options={ROLE_OPTIONS} disabled={isEdit} />
          {needsManager && (
            <Select label="Manager" required value={form.managerId} onChange={(v) => setForm((p) => ({ ...p, managerId: v }))} options={managerOptions} placeholder="Select manager" searchable />
          )}
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
          <Input label="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
          <Input label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="form-section__full" />
          <div className="partner-crm-actions form-section__full">
            <Button variant="accent" type="submit" disabled={saving}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
            <Button variant="ghost" to={isEdit ? `/dashboard/users/${id}` : '/dashboard/users'}>Cancel</Button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
