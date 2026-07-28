import { memo } from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '../../../hooks/useCountUp';
import { formatINR } from '../../../pages/plotInventory/constants';

function KpiValue({ value, decimals = 0, prefix = '', suffix = '' }) {
  const animated = useCountUp(value, { duration: 900, decimals });
  const display =
    decimals > 0
      ? animated.toLocaleString('en-IN', { maximumFractionDigits: decimals })
      : Math.round(animated).toLocaleString('en-IN');
  return (
    <strong className="ws-kpi__value">
      {prefix}
      {display}
      {suffix}
    </strong>
  );
}

function KpiCard({ label, value, tone, trend, format = 'number', decimals = 0 }) {
  let content;
  if (format === 'currency') {
    content = <strong className="ws-kpi__value">{formatINR(value)}</strong>;
  } else if (format === 'percent') {
    content = <KpiValue value={value} suffix="%" />;
  } else {
    content = <KpiValue value={value} decimals={decimals} />;
  }

  return (
    <motion.div
      className={`ws-kpi__card ws-kpi__card--${tone || 'neutral'}`}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <span className="ws-kpi__label">{label}</span>
      {content}
      {trend ? <span className={`ws-kpi__trend ws-kpi__trend--${trend.dir}`}>{trend.label}</span> : null}
      <i className="ws-kpi__glow" aria-hidden />
    </motion.div>
  );
}

function WorkspaceKPIStrip({ metrics }) {
  if (!metrics) return null;

  const items = [
    { label: 'Total Plots', value: metrics.total, tone: 'navy', trend: { dir: 'flat', label: 'Inventory' } },
    { label: 'Available', value: metrics.available, tone: 'success', trend: { dir: 'up', label: 'Live' } },
    { label: 'Booked', value: metrics.booked, tone: 'accent', trend: { dir: 'up', label: 'CRM' } },
    { label: 'Reserved', value: metrics.reserved, tone: 'warning', trend: { dir: 'flat', label: 'Hold' } },
    { label: 'Registered', value: metrics.registered, tone: 'danger', trend: { dir: 'up', label: 'Sold' } },
    { label: 'Mortgaged', value: metrics.mortgaged, tone: 'muted', trend: { dir: 'flat', label: 'Soon' } },
    { label: 'Revenue', value: metrics.revenue, tone: 'emerald', format: 'currency', trend: { dir: 'up', label: 'Booked+' } },
    { label: 'Booking %', value: metrics.bookingPct, tone: 'info', format: 'percent', trend: { dir: 'up', label: 'Pipeline' } },
  ];

  return (
    <motion.div
      className="ws-kpi"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      role="region"
      aria-label="Layout inventory KPIs"
    >
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </motion.div>
  );
}

export default memo(WorkspaceKPIStrip);
