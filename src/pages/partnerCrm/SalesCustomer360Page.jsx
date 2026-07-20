import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import KPIGrid from '../../components/dashboard/KPIGrid';
import DataTable from '../../components/table/DataTable';
import { getCustomer360Profile } from '../../services/sales/salesCrmApi.js';
import { formatDate, formatINR } from '../../utils/format';
import './partner-crm.css';

export default function SalesCustomer360Page() {
  const { customerId } = useParams();
  const [searchParams] = useSearchParams();
  const fromUserId = searchParams.get('from');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCustomer360Profile(customerId)
      .then(setProfile)
      .catch((err) => setError(err.message || 'Failed to load customer profile.'))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="erp-module-page partner-crm-page">
        <PageHeader title="Customer 360° Profile" description="Loading customer..." />
        <p className="partner-crm-page__loading">Loading...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="erp-module-page partner-crm-page">
        <PageHeader title="Customer 360° Profile" description="Unable to load customer." />
        <p className="partner-crm-page__loading">{error || 'Customer not found.'}</p>
        <Button variant="ghost" to={fromUserId ? `/dashboard/sales-crm/performance/${fromUserId}` : '/dashboard/sales-crm/performance'}>
          Back
        </Button>
      </div>
    );
  }

  const customer = profile.customer || {};
  const bookings = profile.bookings || profile.bookingSummaries || [];
  const payments = profile.payments || [];
  const totalPaid = bookings.reduce((sum, row) => sum + Number(row.totalPaid || 0), 0);
  const outstanding = bookings.reduce((sum, row) => sum + Number(row.remainingBalance || 0), 0);

  return (
    <motion.div className="erp-module-page partner-crm-page sales-customer-360" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={customer.name || 'Customer 360° Profile'}
        description={`${customer.mobile || '—'} · ${customer.email || '—'}`}
        actions={(
          <Button
            variant="ghost"
            size="md"
            to={fromUserId ? `/dashboard/sales-crm/performance/${fromUserId}` : '/dashboard/sales-crm/performance'}
          >
            Back
          </Button>
        )}
      />

      <section className="sales-profile-header partner-crm-panel">
        <img src={customer.photo} alt={customer.name} className="sales-profile-header__photo" />
        <div className="sales-profile-header__info">
          <h2>{customer.name}</h2>
          <p>{customer.mobile} · {customer.email || '—'}</p>
          <p>Assigned Sales: {profile.assignedSalesUser?.name || '—'}</p>
          <p>Lead Status: {customer.leadStatus || profile.leads?.[0]?.status || '—'}</p>
          <Badge tone={customer.status === 'ACTIVE' ? 'success' : 'neutral'}>{customer.status}</Badge>
        </div>
      </section>

      <KPIGrid
        items={[
          { label: 'Bookings', value: bookings.length },
          { label: 'Meetings', value: (profile.meetings || []).length },
          { label: 'Follow-ups', value: (profile.followups || []).length },
          { label: 'Paid', value: formatINR(totalPaid), tone: 'success' },
          { label: 'Outstanding', value: formatINR(outstanding), tone: 'warning' },
        ]}
      />

      <div className="partner-crm-panel">
        <h3>Interested Properties</h3>
        {(profile.interestedProperties || []).length === 0
          ? <p>No interested properties recorded.</p>
          : (
            <ul className="sales-customer-360__list">
              {profile.interestedProperties.map((property) => (
                <li key={property.id}>{property.propertyTitle || property.title} · {property.city || '—'}</li>
              ))}
            </ul>
          )}
      </div>

      <div className="partner-crm-panel">
        <h3>Bookings & Reservations</h3>
        <DataTable
          columns={[
            { key: 'bookingNumber', header: 'Booking No.' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'paymentStatus', header: 'Payment Status' },
            { key: 'totalPaid', header: 'Paid', render: (row) => formatINR(row.totalPaid) },
            { key: 'remainingBalance', header: 'Pending', render: (row) => formatINR(row.remainingBalance) },
            { key: 'reservationExpiresAt', header: 'Reservation', render: (row) => formatDate(row.reservationExpiresAt) },
          ]}
          data={bookings}
          rowKey="id"
        />
      </div>

      <div className="partner-crm-panel">
        <h3>Payment History</h3>
        <DataTable
          columns={[
            { key: 'paymentNumber', header: 'Payment No.' },
            { key: 'receiptNumber', header: 'Receipt No.' },
            { key: 'amount', header: 'Amount', render: (row) => formatINR(row.amount) },
            { key: 'paymentMethod', header: 'Method' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'createdAt', header: 'Date', render: (row) => formatDate(row.createdAt) },
          ]}
          data={payments}
          rowKey="id"
        />
      </div>

      <div className="partner-crm-panel">
        <h3>Site Visits & Meetings</h3>
        <DataTable
          columns={[
            { key: 'type', header: 'Type' },
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'title', header: 'Details' },
            { key: 'status', header: 'Status' },
          ]}
          data={[
            ...(profile.meetings || []).map((meeting) => ({
              id: `m-${meeting.id}`,
              type: 'Meeting',
              date: meeting.meetingDate,
              title: `${meeting.purpose || 'Meeting'} · ${meeting.property?.title || meeting.propertyTitle || '—'}`,
              status: meeting.status,
            })),
          ]}
          rowKey="id"
        />
      </div>

      <div className="partner-crm-panel">
        <h3>Follow-ups & Notes</h3>
        <DataTable
          columns={[
            { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'notes', header: 'Notes' },
          ]}
          data={profile.followups || []}
          rowKey="id"
        />
      </div>

      <div className="partner-crm-panel">
        <h3>Lead Lifecycle</h3>
        <DataTable
          columns={[
            { key: 'leadCode', header: 'Lead Code' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} size="sm" /> },
            { key: 'source', header: 'Source' },
            { key: 'propertyTitle', header: 'Property', render: (row) => row.property?.title || row.propertyTitle || '—' },
          ]}
          data={profile.leads || []}
          rowKey="id"
        />
      </div>
    </motion.div>
  );
}
