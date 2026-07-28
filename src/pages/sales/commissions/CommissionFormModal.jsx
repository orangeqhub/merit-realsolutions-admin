import { useEffect, useMemo, useState } from 'react';
import { FiX } from 'react-icons/fi';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/ui/input/Input';
import Select from '../../../components/ui/select/Select';
import { formatSalesUserOption } from '../../../services/users/userApi.js';
import { validateCommissionRule } from './commissionValidation.js';

const emptyRule = { employeeId: '', role: '', commissionType: 'PERCENTAGE', commissionValue: '', effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '', priority: 1, notes: '', status: 'ACTIVE' };
const typeOptions = [{ value: 'PERCENTAGE', label: 'Percentage' }, { value: 'FIXED_AMOUNT', label: 'Fixed Amount' }];
const statusOptions = ['ACTIVE', 'INACTIVE', 'SCHEDULED', 'EXPIRED'].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }));

export default function CommissionFormModal({ open, rule, salesUsers, saving, onClose, onSave }) {
  const viewOnly = Boolean(rule?.viewOnly);
  const [form, setForm] = useState(emptyRule);
  const [errors, setErrors] = useState({});
  useEffect(() => { if (open) { setForm(rule ? { ...emptyRule, ...rule, employeeId: String(rule.employeeId), effectiveFrom: String(rule.effectiveFrom).slice(0, 10), effectiveTo: rule.effectiveTo ? String(rule.effectiveTo).slice(0, 10) : '' } : emptyRule); setErrors({}); } }, [open, rule]);
  const employeeOptions = useMemo(() => [{ value: '', label: 'Select sales person' }, ...salesUsers.map(formatSalesUserOption)], [salesUsers]);
  if (!open) return null;
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectEmployee = (employeeId) => { const user = salesUsers.find((item) => String(item.id) === String(employeeId)); setForm((current) => ({ ...current, employeeId, role: user?.role || '' })); };
  const submit = (event) => { event.preventDefault(); if (viewOnly) return; const validation = validateCommissionRule(form); setErrors(validation); if (!Object.keys(validation).length) onSave({ ...form, employeeId: Number(form.employeeId), commissionValue: Number(form.commissionValue), priority: Number(form.priority) }); };
  return <div className="commission-modal" role="presentation" onMouseDown={onClose}>
    <div className="commission-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="commission-rule-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="commission-modal__header"><div><h2 id="commission-rule-title">{viewOnly ? 'Commission Rule Details' : rule ? 'Edit Commission Rule' : 'Add Commission Rule'}</h2><p>Configure a rule only. No commission calculations or payments are created here.</p></div><button type="button" className="commission-modal__close" onClick={onClose} aria-label="Close"><FiX /></button></div>
      <form className="commission-modal__form" onSubmit={submit}>
        <Select label="Sales Person" required searchable value={form.employeeId} onChange={selectEmployee} options={employeeOptions} error={errors.employeeId} disabled={viewOnly} />
        <Input label="Employee ID" value={salesUsers.find((item) => String(item.id) === String(form.employeeId))?.employeeCode || '—'} disabled />
        <Input label="Role" value={form.role ? (salesUsers.find((item) => String(item.id) === String(form.employeeId))?.roleLabel || form.role.replaceAll('_', ' ')) : '—'} disabled />
        <Select label="Commission Type" required value={form.commissionType} onChange={(value) => change('commissionType', value)} options={typeOptions} error={errors.commissionType} disabled={viewOnly} />
        <Input label={form.commissionType === 'PERCENTAGE' ? 'Commission Value (%)' : 'Commission Value (₹)'} required type="number" min={form.commissionType === 'PERCENTAGE' ? '0.01' : '0'} max={form.commissionType === 'PERCENTAGE' ? '100' : undefined} step="0.01" value={form.commissionValue} onChange={(event) => change('commissionValue', event.target.value)} error={errors.commissionValue} disabled={viewOnly} />
        <Input label="Effective From" required type="date" value={form.effectiveFrom} onChange={(event) => change('effectiveFrom', event.target.value)} error={errors.effectiveFrom} />
        <Input label="Effective To" type="date" value={form.effectiveTo} onChange={(event) => change('effectiveTo', event.target.value)} error={errors.effectiveTo} />
        <Input label="Priority" required type="number" min="1" step="1" value={form.priority} onChange={(event) => change('priority', event.target.value)} error={errors.priority} />
        <Select label="Status" value={form.status} onChange={(value) => change('status', value)} options={statusOptions} />
        <label className="commission-modal__notes erp-field"><span className="erp-field__label">Notes</span><textarea className="erp-control" rows="3" value={form.notes} onChange={(event) => change('notes', event.target.value)} placeholder="Optional rule notes" /></label>
        <div className="commission-modal__actions"><Button variant="ghost" onClick={onClose}>{viewOnly ? 'Close' : 'Cancel'}</Button>{!viewOnly && <Button type="submit" variant="primary" loading={saving}>{rule ? 'Save Changes' : 'Create Rule'}</Button>}</div>
      </form>
    </div>
  </div>;
}
