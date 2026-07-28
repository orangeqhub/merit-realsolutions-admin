import KPIGrid from '../../../components/dashboard/KPIGrid';

export default function CommissionStats({ stats, loading }) {
  const values = stats || {};
  return <KPIGrid loading={loading} items={[
    { label: 'Total Rules', value: values.totalRules || 0, tone: 'primary' },
    { label: 'Percentage Based', value: values.percentageBased || 0, tone: 'accent' },
    { label: 'Fixed Amount', value: values.fixedAmount || 0, tone: 'violet' },
    { label: 'Active Rules', value: values.activeRules || 0, tone: 'success' },
    { label: 'Inactive Rules', value: values.inactiveRules || 0, tone: 'neutral' },
  ]} />;
}
