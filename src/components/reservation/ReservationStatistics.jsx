import {
  FiBookmark,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiUnlock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiDollarSign,
} from "react-icons/fi";
import StatsCard from "../cards/StatsCard";

export default function ReservationStatistics({ stats }) {
  if (!stats) return null;

  return (
    <div className="rsv-stats-grid">
      <StatsCard icon={<FiBookmark />} label="Total Reservations" value={stats.total} tone="accent" delay={0} />
      <StatsCard icon={<FiCalendar />} label="Today's Reservations" value={stats.todays} tone="violet" delay={0.04} />
      <StatsCard icon={<FiClock />} label="Expiring Today" value={stats.expiringToday} tone="warning" delay={0.08} />
      <StatsCard icon={<FiAlertCircle />} label="Expired" value={stats.expired} tone="danger" delay={0.12} />
      <StatsCard icon={<FiUnlock />} label="Released" value={stats.released} tone="muted" delay={0.16} />
      <StatsCard icon={<FiCheckCircle />} label="Confirmed" value={stats.confirmed} tone="success" delay={0.2} />
      <StatsCard icon={<FiXCircle />} label="Cancelled" value={stats.cancelled} tone="danger" delay={0.24} />
      <StatsCard
        icon={<FiTrendingUp />}
        label="Conversion Rate"
        value={stats.conversionRate}
        suffix="%"
        tone="accent"
        delay={0.28}
      />
      <StatsCard
        icon={<FiDollarSign />}
        label="Reservation Value"
        value={Math.round(stats.totalValue / 100000)}
        prefix="₹"
        suffix=" L"
        tone="success"
        delay={0.32}
      />
      <StatsCard
        icon={<FiDollarSign />}
        label="Revenue Pipeline"
        value={Math.round(stats.pipeline / 100000)}
        prefix="₹"
        suffix=" L"
        tone="violet"
        delay={0.36}
      />
    </div>
  );
}
