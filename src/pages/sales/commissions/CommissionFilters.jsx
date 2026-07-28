import Input from '../../../components/ui/input/Input';
import Select from '../../../components/ui/select/Select';

const roles = [{ value: '', label: 'All roles' }, { value: 'AREA_BUSINESS_EXECUTIVE', label: 'Sales Executive' }, { value: 'AREA_BUSINESS_COORDINATOR', label: 'Team Leader' }, { value: 'AREA_BUSINESS_PARTNER', label: 'Agent' }, { value: 'CHANNEL_AGENT', label: 'Channel Partner' }];
const types = [{ value: '', label: 'All types' }, { value: 'PERCENTAGE', label: 'Percentage' }, { value: 'FIXED_AMOUNT', label: 'Fixed Amount' }];
const statuses = [{ value: '', label: 'All statuses' }, ...['ACTIVE', 'INACTIVE', 'SCHEDULED', 'EXPIRED'].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }))];

export default function CommissionFilters({ filters, onChange }) {
  return <section className="commission-filters partner-crm-panel" aria-label="Commission rule filters">
    <Input placeholder="Search sales person or employee ID" value={filters.search} onChange={(event) => onChange('search', event.target.value)} />
    <Select value={filters.role} onChange={(value) => onChange('role', value)} options={roles} placeholder="Role" />
    <Select value={filters.commissionType} onChange={(value) => onChange('commissionType', value)} options={types} placeholder="Commission Type" />
    <Select value={filters.status} onChange={(value) => onChange('status', value)} options={statuses} placeholder="Status" />
  </section>;
}
