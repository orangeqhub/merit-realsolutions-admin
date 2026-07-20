import { motion } from "framer-motion";
import { FiMap, FiList, FiSettings, FiShield, FiActivity } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/button/Button";
import BarChart from "../../../components/charts/BarChart";
import DonutChart from "../../../components/charts/DonutChart";
import ReservationStatistics from "../../../components/reservation/ReservationStatistics";
import { useReservations } from "../../../context/ReservationContext";
import { formatDate } from "../../../utils/format";
import "../../../components/reservation/reservation.css";

export default function ReservationDashboard() {
  const { getStats, getCharts, getRecentActivities } = useReservations();
  const stats = getStats();
  const charts = getCharts();
  const recent = getRecentActivities(8);

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Reservation Domain Dashboard"
        description="Enterprise overview of reservation lifecycle, expiry analysis, and revenue pipeline across all ventures."
        actions={
          <>
            <Button variant="ghost" size="md" to="/dashboard/reservations/interactive" icon={<FiMap />}>
              Interactive Reservation
            </Button>
            <Button variant="accent" size="md" to="/dashboard/reservations/list" icon={<FiList />}>
              All Reservations
            </Button>
          </>
        }
      />

      <ReservationStatistics stats={stats} />

      <div className="rsv-grid-2">
        <motion.section
          className="rsv-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <header className="rsv-panel__head">
            <div>
              <h3>Reservation Trends</h3>
              <p>New reservations over the last 6 months</p>
            </div>
          </header>
          <div className="rsv-chart-wrap">
            <BarChart data={charts.trends} color="var(--erp-accent)" />
          </div>
        </motion.section>

        <motion.section
          className="rsv-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <header className="rsv-panel__head">
            <div>
              <h3>Status Distribution</h3>
              <p>Current reservation lifecycle breakdown</p>
            </div>
          </header>
          <div className="rsv-chart-wrap erp-dashboard__donut">
            <DonutChart data={charts.statusDistribution} centerLabel="Reservations" />
          </div>
        </motion.section>
      </div>

      <div className="rsv-grid-2">
        <motion.section
          className="rsv-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <header className="rsv-panel__head">
            <div>
              <h3>Expiry Analysis</h3>
              <p>Reserved inventory approaching expiry</p>
            </div>
          </header>
          <div className="rsv-chart-wrap">
            <BarChart data={charts.expiryAnalysis} color="var(--erp-warning)" />
          </div>
        </motion.section>

        <motion.section
          className="rsv-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <header className="rsv-panel__head">
            <div>
              <h3>Recent Activities</h3>
              <p>Latest reservation domain events</p>
            </div>
            <Button variant="ghost" size="sm" to="/dashboard/reservations/activity" icon={<FiActivity />}>
              Activity Logs
            </Button>
          </header>
          <div className="rsv-feed">
            {recent.map((item, i) => (
              <div key={`${item.reservationId}-${i}`} className="rsv-feed__item">
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.reservationRef} · {item.customerName} · {item.plotNumber}
                  </span>
                  <span>{item.description}</span>
                </div>
                <span>{formatDate(item.date)}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <section className="rsv-panel">
        <header className="rsv-panel__head">
          <div>
            <h3>Domain Navigation</h3>
            <p>Reservation Management screens</p>
          </div>
        </header>
        <div className="rsv-quick-actions">
          <Button variant="ghost" to="/dashboard/reservations/list" icon={<FiList />}>Reservations</Button>
          <Button variant="ghost" to="/dashboard/reservations/interactive" icon={<FiMap />}>Interactive Reservation</Button>
          <Button variant="ghost" to="/dashboard/reservations/settings" icon={<FiSettings />}>Settings</Button>
          <Button variant="ghost" to="/dashboard/reservations/rules" icon={<FiShield />}>Rules Engine</Button>
          <Button variant="ghost" to="/dashboard/reservations/activity" icon={<FiActivity />}>Activity Logs</Button>
        </div>
      </section>
    </div>
  );
}
