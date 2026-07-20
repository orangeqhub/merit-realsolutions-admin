import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import { formatINR } from "../utils/format";
import { useAuth } from "../context/AuthContext.jsx";
import { getAdminDashboard } from "../services/admin/adminDashboardApi.js";
import ActionCenter from "../components/notifications/ActionCenter.jsx";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDisplayDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function displayUserName(user) {
  if (user?.name) return user.name.split(" ")[0];
  if (user?.username) return user.username;
  return "Admin";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getAdminDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const crm = dashboard?.crm;
    const lifecycle = dashboard?.lifecycle;
    const properties = dashboard?.properties;
    const bookings = dashboard?.bookings;
    const payments = dashboard?.payments;
    const revenue = Number(payments?.totalRevenue || 0);

    return [
      {
        label: "Published Properties",
        value: String(properties?.published ?? 0),
        change: `${lifecycle?.siteVisits ?? 0} site visits`,
        trend: "up",
      },
      {
        label: "Customers",
        value: String(crm?.totalCustomers ?? 0),
        change: `${crm?.openLeads ?? 0} open leads`,
        trend: "up",
      },
      {
        label: "Bookings",
        value: String(bookings?.total ?? 0),
        change: `${bookings?.active ?? 0} active`,
        trend: "up",
      },
      {
        label: "Collected Revenue",
        value: formatINR(revenue),
        change: `${payments?.approvedPayments ?? 0} approved payments`,
        trend: revenue > 0 ? "up" : "down",
      },
    ];
  }, [dashboard]);

  const financialStats = useMemo(() => {
    const payments = dashboard?.payments;
    const bookings = dashboard?.bookings;
    return [
      { label: "Today's Collections", value: formatINR(payments?.todaysCollections ?? 0) },
      { label: "Monthly Collections", value: formatINR(payments?.monthlyCollections ?? 0) },
      { label: "Pending Payments", value: String(payments?.pendingApproval ?? 0) },
      { label: "Outstanding Balance", value: formatINR(payments?.outstandingBalance ?? 0) },
      { label: "Reservations", value: String(payments?.reservationCount ?? 0) },
      { label: "Completed Sales", value: String(payments?.completedSales ?? 0) },
      { label: "Cancelled Bookings", value: String(bookings?.cancelled ?? 0) },
      { label: "Expired Reservations", value: String(bookings?.expired ?? 0) },
    ];
  }, [dashboard]);

  const lifecycle = dashboard?.lifecycle;
  const crm = dashboard?.crm;
  const recentVentures = dashboard?.ventures || [];
  const recentBookings = dashboard?.bookings?.recent || [];

  if (loading) {
    return <div className="dashboard"><p className="dashboard__subtitle">Loading live dashboard…</p></div>;
  }

  if (error) {
    return <div className="dashboard"><p className="dashboard__subtitle">{error}</p></div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard__welcome">
        <div>
          <p className="dashboard__date">{formatDisplayDate()}</p>
          <h1 className="dashboard__title">{getGreeting()}, {displayUserName(user)}</h1>
          <p className="dashboard__subtitle">
            Live metrics from CRM, lifecycle, properties, bookings, and payments.
          </p>
        </div>
        <Link to="/dashboard/sales-crm" className="dashboard__export-btn">
          Open Sales CRM
        </Link>
      </header>

      <ActionCenter />

      <section className="dashboard__stats">
        {stats.map((stat) => (
          <article key={stat.label} className="dashboard__stat-card">
            <div className="dashboard__stat-top">
              <span className={`dashboard__stat-change dashboard__stat-change--${stat.trend}`}>
                {stat.change}
              </span>
            </div>
            <p className="dashboard__stat-value">{stat.value}</p>
            <p className="dashboard__stat-label">{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="dashboard__stats">
        {financialStats.map((stat) => (
          <article key={stat.label} className="dashboard__stat-card">
            <p className="dashboard__stat-value">{stat.value}</p>
            <p className="dashboard__stat-label">{stat.label}</p>
          </article>
        ))}
      </section>

      <div className="dashboard__grid">
        <section className="dashboard__card dashboard__card--chart">
          <div className="dashboard__card-header">
            <div>
              <h2 className="dashboard__card-title">Sales Lifecycle Funnel</h2>
              <p className="dashboard__card-subtitle">Lead lifecycle counts</p>
            </div>
          </div>
          {lifecycle ? (
            <div className="dashboard__summary">
              <div className="dashboard__summary-item"><span className="dashboard__summary-label">Enquiries</span><span className="dashboard__summary-value">{lifecycle.totalEnquiries ?? 0}</span></div>
              <div className="dashboard__summary-item"><span className="dashboard__summary-label">Negotiations</span><span className="dashboard__summary-value">{lifecycle.negotiations ?? 0}</span></div>
              <div className="dashboard__summary-item"><span className="dashboard__summary-label">Sold</span><span className="dashboard__summary-value">{lifecycle.soldProperties ?? 0}</span></div>
              <div className="dashboard__summary-item"><span className="dashboard__summary-label">Conversion</span><span className="dashboard__summary-value">{lifecycle.conversionRate ?? 0}%</span></div>
            </div>
          ) : (
            <p className="dashboard__subtitle">No lifecycle data yet.</p>
          )}
        </section>

        <section className="dashboard__card dashboard__card--actions">
          <h2 className="dashboard__card-title">Quick Actions</h2>
          <div className="dashboard__actions">
            <Link to="/dashboard/sales-crm/leads" className="dashboard__action-btn">Manage Leads</Link>
            <Link to="/dashboard/sales-crm/site-visits" className="dashboard__action-btn">Site Visits</Link>
            <Link to="/dashboard/properties/list" className="dashboard__action-btn">Properties</Link>
            <Link to="/dashboard/property-bookings" className="dashboard__action-btn">Property Bookings</Link>
          </div>
          <div className="dashboard__summary">
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Today&apos;s Meetings</span><span className="dashboard__summary-value">{crm?.todaysMeetings ?? 0}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Today&apos;s Follow-ups</span><span className="dashboard__summary-value">{crm?.todaysFollowUps ?? 0}</span></div>
            <div className="dashboard__summary-item"><span className="dashboard__summary-label">Assigned Properties</span><span className="dashboard__summary-value">{crm?.assignedProperties ?? 0}</span></div>
          </div>
        </section>
      </div>

      <div className="dashboard__grid dashboard__grid--bottom">
        <section className="dashboard__card dashboard__card--table">
          <div className="dashboard__card-header">
            <h2 className="dashboard__card-title">Venture Catalog</h2>
            <Link to="/dashboard/sales-crm/venture-assignment" className="dashboard__card-link">Assignments</Link>
          </div>
          {recentVentures.length === 0 ? (
            <p className="dashboard__subtitle">No ventures in catalog yet.</p>
          ) : (
            <div className="dashboard__table-wrap">
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVentures.map((venture) => (
                    <tr key={venture.refId || venture.id}>
                      <td>{venture.code || venture.refId}</td>
                      <td>{venture.name}</td>
                      <td>{venture.location}</td>
                      <td>{venture.status || (venture.isActive ? 'Active' : 'Inactive')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dashboard__card dashboard__card--activity">
          <div className="dashboard__card-header">
            <h2 className="dashboard__card-title">Recent Bookings</h2>
            <Link to="/dashboard/property-bookings" className="dashboard__card-link">View all</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="dashboard__subtitle">No bookings yet.</p>
          ) : (
            <ul className="dashboard__activity-list">
              {recentBookings.map((booking) => (
                <li key={booking.id || booking.bookingNumber} className="dashboard__activity-item">
                  <span className="dashboard__activity-dot dashboard__activity-dot--booking" />
                  <div>
                    <p className="dashboard__activity-text">{booking.bookingNumber} · {booking.entity?.title || 'Property'} · {booking.status}</p>
                    <span className="dashboard__activity-time">{formatINR(booking.totalPaid || 0)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
