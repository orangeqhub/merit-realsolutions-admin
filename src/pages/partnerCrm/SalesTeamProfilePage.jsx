import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import KPIGrid from '../../components/dashboard/KPIGrid';
import DataTable from '../../components/table/DataTable';
import {
  getSalesPerformanceProfile,
  getSalesPerformanceTeam,
  getSalesTeamCustomers,
  listLifecycleDocuments,
  listLifecycleFollowUps,
  listSalesLeads,
  listSalesMeetings,
  listSiteVisits,
} from '../../services/sales/salesCrmApi.js';
import { listBookings } from '../../services/booking/bookingApi.js';
import { listPayments } from '../../services/booking/installmentPaymentApi.js';
import { fetchAllPages } from '../../utils/fetchAllPages.js';
import { formatDate, formatINR } from '../../utils/format';
import './partner-crm.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'customers', label: 'Customers' },
  { id: 'leads', label: 'Leads' },
  { id: 'site-visits', label: 'Site Visits' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'follow-ups', label: 'Follow-ups' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'payments', label: 'Payments' },
  { id: 'documents', label: 'Documents' },
];

function TabPanel({ active, id, children }) {
  if (active !== id) return null;
  return <div className="sales-profile-tab-panel">{children}</div>;
}

export default function SalesTeamProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSalesPerformanceProfile(userId),
      getSalesPerformanceTeam(userId).catch(() => null),
    ])
      .then(([profileData, teamData]) => {
        setProfile(profileData);
        setTeam(teamData);
      })
      .catch((err) => setError(err.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId || activeTab === 'overview') return undefined;

    let cancelled = false;
    setTabLoading(true);

    const loaders = {
      customers: () => getSalesTeamCustomers(userId),
      leads: () => fetchAllPages((params) => listSalesLeads({ ...params, assigneeUserId: userId })),
      'site-visits': () => listSiteVisits({ assigneeUserId: userId }),
      meetings: () => listSalesMeetings({ assigneeUserId: userId }),
      'follow-ups': () => listLifecycleFollowUps({ assigneeUserId: userId }),
      bookings: () => fetchAllPages((params) => listBookings({ ...params, assigneeUserId: userId })),
      payments: async () => {
        const paymentsResult = await fetchAllPages(listPayments);
        return (paymentsResult || []).filter((payment) => Number(payment.booking?.assignee?.id) === Number(userId));
      },
      documents: async () => {
        const customers = await getSalesTeamCustomers(userId);
        const customerIds = [...new Set((customers || []).map((row) => row.id).filter(Boolean))];
        if (!customerIds.length) return [];
        const chunks = await Promise.all(
          customerIds.map((customerUserId) => listLifecycleDocuments({ customerUserId }))
        );
        return chunks.flat();
      },
    };

    loaders[activeTab]?.()
      .then((data) => {
        if (!cancelled) setTabData((prev) => ({ ...prev, [activeTab]: data?.items || data || [] }));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load tab data.');
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeTab, userId]);

  const summaryItems = useMemo(() => {
    const summary = profile?.summary || {};
    return [
      { label: 'Customers', value: summary.customers ?? 0 },
      { label: 'Leads', value: summary.leads ?? 0 },
      { label: 'Site Visits', value: summary.siteVisits ?? 0 },
      { label: 'Bookings', value: summary.bookings ?? 0 },
      { label: 'Collections', value: formatINR(summary.paymentsCollected || 0), tone: 'primary' },
      { label: 'Outstanding', value: formatINR(summary.outstandingAmount || 0), tone: 'warning' },
      { label: 'Completed Sales', value: summary.completedSales ?? 0, tone: 'success' },
      { label: 'Conversion', value: `${summary.conversionRate ?? 0}%`, tone: 'accent' },
    ];
  }, [profile]);

  if (loading) {
    return (
      <div className="erp-module-page partner-crm-page">
        <PageHeader title="Sales Team Profile" description="Loading profile..." />
        <p className="partner-crm-page__loading">Loading...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="erp-module-page partner-crm-page">
        <PageHeader title="Sales Team Profile" description="Unable to load profile." />
        <p className="partner-crm-page__loading">{error}</p>
        <Button variant="ghost" to="/dashboard/sales-crm/performance">Back to Performance</Button>
      </div>
    );
  }

  const user = profile?.user || {};

  return (
    <motion.div className="erp-module-page partner-crm-page sales-profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={user.name || 'Sales Team Profile'}
        description={`${user.roleLabel || user.role || 'Sales'} · ${user.employeeCode || '—'} · 360° management view`}
        actions={<Button variant="ghost" size="md" to="/dashboard/sales-crm/performance">Back to Performance</Button>}
      />

      <section className="sales-profile-header partner-crm-panel">
        <img src={user.photo} alt={user.name} className="sales-profile-header__photo" />
        <div className="sales-profile-header__info">
          <h2>{user.name}</h2>
          <p>{user.employeeCode} · {user.roleLabel}</p>
          <p>{user.phone || '—'} · {user.email || '—'}</p>
          <p>Areas: {(user.assignedAreas || []).join(' · ') || '—'}</p>
          <p>Manager: {user.manager?.name || '—'} · Joined: {formatDate(user.joiningDate)}</p>
          <Badge tone={user.status === 'ACTIVE' ? 'success' : 'neutral'}>{user.status}</Badge>
        </div>
        <div className="sales-profile-header__tasks">
          <strong>Today</strong>
          <p>{profile?.todaysTasks?.meetings || 0} meetings</p>
          <p>{profile?.todaysTasks?.followUps || 0} follow-ups</p>
        </div>
      </section>

      <KPIGrid items={summaryItems} minWidth={160} />

      <div className="sales-profile-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sales-profile-tabs__btn ${activeTab === tab.id ? 'sales-profile-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabLoading && activeTab !== 'overview' && <p className="partner-crm-page__loading">Loading {activeTab}...</p>}

      <TabPanel active={activeTab} id="overview">
        {team?.members?.length ? (
          <div className="partner-crm-panel">
            <h3>Team Hierarchy</h3>
            <div className="sales-team-tree">
              <div className="sales-team-tree__node sales-team-tree__node--leader">
                <strong>{team.leader?.name}</strong>
                <span>{team.leader?.roleLabel}</span>
                <small>{formatINR(team.rollUp?.revenueGenerated || 0)} collected</small>
              </div>
              {team.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className="sales-team-tree__node"
                  onClick={() => navigate(`/dashboard/sales-crm/performance/${member.id}`)}
                >
                  <strong>{member.name}</strong>
                  <span>{member.roleLabel}</span>
                  <small>{member.metrics?.customers || 0} customers · {member.metrics?.bookings || 0} bookings · {formatINR(member.metrics?.revenueGenerated || 0)}</small>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="partner-crm-panel">
            <p>This profile shows individual performance metrics for the selected sales team member.</p>
          </div>
        )}
      </TabPanel>

      <TabPanel active={activeTab} id="customers">
        <DataTable
          columns={[
            { key: 'customer', header: 'Customer' },
            { key: 'mobile', header: 'Mobile' },
            { key: 'property', header: 'Property' },
            { key: 'bookingStatus', header: 'Booking Status' },
            { key: 'paymentStatus', header: 'Payment Status' },
            { key: 'paid', header: 'Paid', render: (row) => formatINR(row.paid) },
            { key: 'pending', header: 'Pending', render: (row) => formatINR(row.pending) },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/sales-crm/customers/${row.id}?from=${userId}`)}>
                  Open 360°
                </Button>
              ),
            },
          ]}
          data={tabData.customers || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="leads">
        <DataTable
          columns={[
            { key: 'leadCode', header: 'Lead Code' },
            { key: 'name', header: 'Customer' },
            { key: 'mobile', header: 'Mobile' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'source', header: 'Source' },
            { key: 'priority', header: 'Priority' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.property?.title || row.propertyTitle || '—' },
          ]}
          data={tabData.leads || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="site-visits">
        <DataTable
          columns={[
            { key: 'customerName', header: 'Customer' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.property?.title || row.propertyTitle || '—' },
            { key: 'preferredDate', header: 'Visit Date', render: (row) => formatDate(row.preferredDate || row.visitDate) },
            { key: 'workflowStatus', header: 'Status' },
            { key: 'visitOutcome', header: 'Outcome' },
            { key: 'nextFollowUpDate', header: 'Next Follow-up', render: (row) => formatDate(row.nextFollowUpDate) },
          ]}
          data={tabData['site-visits'] || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="meetings">
        <DataTable
          columns={[
            { key: 'meetingDate', header: 'Date', render: (row) => formatDate(row.meetingDate) },
            { key: 'customerName', header: 'Customer' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.property?.title || row.propertyTitle || '—' },
            { key: 'purpose', header: 'Purpose' },
            { key: 'status', header: 'Status' },
            { key: 'notes', header: 'Notes' },
          ]}
          data={tabData.meetings || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="follow-ups">
        <DataTable
          columns={[
            { key: 'customerName', header: 'Customer', render: (row) => row.customer?.name || row.customerName || '—' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.property?.title || '—' },
            { key: 'followUpDate', header: 'Due Date', render: (row) => formatDate(row.followUpDate) },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'stage', header: 'Stage' },
            { key: 'notes', header: 'Notes' },
          ]}
          data={tabData['follow-ups'] || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="bookings">
        <DataTable
          columns={[
            { key: 'bookingNumber', header: 'Booking No.' },
            { key: 'customerName', header: 'Customer' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.entity?.title || '—' },
            { key: 'status', header: 'Booking Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'totalPaid', header: 'Paid', render: (row) => formatINR(row.totalPaid) },
            { key: 'remainingBalance', header: 'Pending', render: (row) => formatINR(row.remainingBalance) },
            {
              key: 'actions',
              header: '',
              render: (row) => <Button size="sm" variant="ghost" to={`/dashboard/property-bookings/${row.id}`}>Details</Button>,
            },
          ]}
          data={tabData.bookings || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="payments">
        <DataTable
          columns={[
            { key: 'paymentNumber', header: 'Payment No.' },
            { key: 'receiptNumber', header: 'Receipt No.' },
            { key: 'amount', header: 'Amount', render: (row) => formatINR(row.amount) },
            { key: 'paymentMethod', header: 'Method' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'bookingNumber', header: 'Booking', render: (row) => row.booking?.bookingNumber || '—' },
            {
              key: 'receipt',
              header: 'Receipt',
              render: (row) => row.receiptNumber
                ? <Link to={`/dashboard/receipts/${row.id}`}>View</Link>
                : '—',
            },
          ]}
          data={tabData.payments || []}
          rowKey="id"
        />
      </TabPanel>

      <TabPanel active={activeTab} id="documents">
        <DataTable
          columns={[
            { key: 'documentType', header: 'Document' },
            { key: 'customerName', header: 'Customer', render: (row) => row.customer?.name || row.customerName || '—' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.property?.title || '—' },
            { key: 'status', header: 'Status' },
            {
              key: 'fileUrl',
              header: 'Download',
              render: (row) => row.fileUrl ? <a href={row.fileUrl} target="_blank" rel="noreferrer">Download</a> : '—',
            },
          ]}
          data={tabData.documents || []}
          rowKey="id"
        />
      </TabPanel>
    </motion.div>
  );
}
