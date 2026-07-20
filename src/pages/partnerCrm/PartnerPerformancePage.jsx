import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Select from '../../components/ui/select/Select';
import Input from '../../components/ui/input/Input';
import Badge from '../../components/ui/badge/Badge';
import KPIGrid from '../../components/dashboard/KPIGrid';
import {
  exportSalesPerformance,
  getSalesPerformance,
} from '../../services/sales/salesCrmApi.js';
import { formatINR } from '../../utils/format';
import './partner-crm.css';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'AREA_BUSINESS_PARTNER', label: 'ABP' },
  { value: 'AREA_BUSINESS_COORDINATOR', label: 'ABC' },
  { value: 'AREA_BUSINESS_EXECUTIVE', label: 'ABE' },
];

const PERFORMANCE_COLUMNS = [
  { key: 'employeeCode', label: 'Employee Code' },
  { key: 'name', label: 'Employee Name' },
  { key: 'roleLabel', label: 'Role' },
  { key: 'assignedAreas', label: 'Assigned Area' },
  { key: 'manager', label: 'Manager' },
  { key: 'assignedCustomers', label: 'Customers' },
  { key: 'leadsContacted', label: 'Leads' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'siteVisits', label: 'Site Visits' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'interestedCustomers', label: 'Interested' },
  { key: 'negotiations', label: 'Negotiations' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'partialPayments', label: 'Partial Payments' },
  { key: 'completedSales', label: 'Completed Sales' },
  { key: 'revenueGenerated', label: 'Revenue' },
  { key: 'outstandingAmount', label: 'Outstanding' },
  { key: 'pendingFollowUps', label: 'Pending F/U' },
  { key: 'overdueFollowUps', label: 'Overdue F/U' },
  { key: 'conversionRate', label: 'Conversion %' },
  { key: 'status', label: 'Status' },
];

function cellValue(row, key) {
  if (key === 'manager') return row.manager?.name || '—';
  if (key === 'revenueGenerated' || key === 'outstandingAmount') return formatINR(row[key] || 0);
  if (key === 'conversionRate') return `${row.conversionRate ?? 0}%`;
  if (key === 'status') return row.status || '—';
  return row[key] ?? 0;
}

export default function PartnerPerformancePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [area, setArea] = useState('');
  const [performance, setPerformance] = useState('');
  const [exporting, setExporting] = useState(false);

  const query = useMemo(() => ({
    search: search.trim() || undefined,
    role: role || undefined,
    area: area.trim() || undefined,
    performance: performance || undefined,
  }), [search, role, area, performance]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError('');
    getSalesPerformance(query)
      .then(setItems)
      .catch((err) => setError(err.message || 'Failed to load performance.'))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const summary = useMemo(() => ({
    teamSize: items.length,
    customers: items.reduce((sum, row) => sum + (row.assignedCustomers || 0), 0),
    bookings: items.reduce((sum, row) => sum + (row.bookings || 0), 0),
    revenue: items.reduce((sum, row) => sum + (row.revenueGenerated || 0), 0),
  }), [items]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const { blob, filename } = await exportSalesPerformance(query);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div className="erp-module-page partner-crm-page sales-performance-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Sales Team Performance"
        description="Live CRM and financial metrics for every sales team member. Click a row to open the 360° profile."
        actions={(
          <>
            <Button variant="ghost" size="md" onClick={() => window.print()}>Print / PDF</Button>
            <Button variant="ghost" size="md" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </>
        )}
      />

      <KPIGrid
        items={[
          { label: 'Sales Team', value: summary.teamSize, tone: 'primary' },
          { label: 'Assigned Customers', value: summary.customers, tone: 'accent' },
          { label: 'Total Bookings', value: summary.bookings, tone: 'success' },
          { label: 'Collections', value: formatINR(summary.revenue), tone: 'primary' },
        ]}
      />

      <div className="partner-crm-panel sales-performance-filters">
        <div className="sales-performance-filters__grid">
          <Input
            placeholder="Search employee, customer, mobile, booking, property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Input placeholder="Filter by area" value={area} onChange={(e) => setArea(e.target.value)} />
          <Select value={performance} onChange={(e) => setPerformance(e.target.value)}>
            <option value="">All Performance</option>
            <option value="top">Top Performers</option>
            <option value="low">Low Conversion</option>
          </Select>
        </div>
      </div>

      {loading && <p className="partner-crm-page__loading">Loading performance...</p>}
      {error && !loading && <p className="partner-crm-page__loading">{error}</p>}

      {!loading && !error && (
        <div className="partner-crm-panel">
          <div className="partner-crm-table-wrap sales-performance-table-wrap">
            <table className="partner-crm-table sales-performance-table">
              <thead>
                <tr>
                  {PERFORMANCE_COLUMNS.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={PERFORMANCE_COLUMNS.length}>No sales team members match the current filters.</td>
                  </tr>
                ) : items.map((row) => (
                  <tr
                    key={row.userId}
                    className="sales-performance-row"
                    onClick={() => navigate(`/dashboard/sales-crm/performance/${row.userId}`)}
                  >
                    {PERFORMANCE_COLUMNS.map((column) => (
                      <td key={column.key}>
                        {column.key === 'status'
                          ? <Badge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">{cellValue(row, column.key)}</Badge>
                          : cellValue(row, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
