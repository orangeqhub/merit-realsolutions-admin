import { FiEdit2, FiEye, FiPower, FiTrash2 } from 'react-icons/fi';
import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import DataTable from '../../../components/table/DataTable';

const date = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN') : '—';
const value = (row) => row.commissionType === 'PERCENTAGE' ? `${row.commissionValue}%` : `₹${Number(row.commissionValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function CommissionTable({ data, loading, onView, onEdit, onStatusChange, onDelete }) {
  const columns = [
    { key: 'salesPerson', header: 'Sales Person', render: (row) => row.salesPerson || '—' }, { key: 'employeeCode', header: 'Employee ID', render: (row) => row.employeeCode || '—' },
    { key: 'roleLabel', header: 'Role' }, { key: 'commissionType', header: 'Commission Type', render: (row) => row.commissionType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount' },
    { key: 'commissionValue', header: 'Commission Value', render: value }, { key: 'effectiveFrom', header: 'Effective From', render: (row) => date(row.effectiveFrom) }, { key: 'effectiveTo', header: 'Effective To', render: (row) => date(row.effectiveTo) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status}>{row.status[0] + row.status.slice(1).toLowerCase()}</Badge> }, { key: 'createdByName', header: 'Created By', render: (row) => row.createdByName || '—' }, { key: 'updatedAt', header: 'Last Updated', render: (row) => date(row.updatedAt) },
    { key: 'actions', header: 'Actions', render: (row) => <div className="commission-actions"><Button variant="ghost" size="sm" iconOnly aria-label="View rule" onClick={() => onView(row)}><FiEye /></Button><Button variant="ghost" size="sm" iconOnly aria-label="Edit rule" onClick={() => onEdit(row)}><FiEdit2 /></Button><Button variant="ghost" size="sm" iconOnly aria-label={row.status === 'ACTIVE' ? 'Deactivate rule' : 'Activate rule'} onClick={() => onStatusChange(row, row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}><FiPower /></Button><Button variant="ghost" size="sm" iconOnly aria-label="Delete rule" onClick={() => onDelete(row)}><FiTrash2 /></Button></div> },
  ];
  return <DataTable columns={columns} data={data} loading={loading} paginated={false} emptyState={<div className="commission-empty"><h3>No commission rules found</h3><p>Adjust the filters or create your first commission rule.</p></div>} />;
}
