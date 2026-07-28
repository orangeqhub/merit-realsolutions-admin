import {
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiHeart,
  FiLayers,
  FiMap,
  FiTag,
  FiTool,
  FiSun,
  FiUploadCloud,
  FiBookmark,
  FiAlertCircle,
} from 'react-icons/fi';
import Button from '../ui/button/Button';
import InfoCard from '../cards/InfoCard';
import SummaryCard from '../cards/SummaryCard';
import EmptyState from '../layout/EmptyState';
import LayoutTimeline from './LayoutTimeline';
import { LAYOUT_LABELS, LAYOUT_MESSAGES } from '../../pages/layouts/layoutTerminology';
import { formatArea } from '../../pages/layouts/constants';

export default function LayoutDashboardPanels({
  layout,
  venture,
  location,
  gisSummary,
  plots,
  onImport,
  onGenerate,
}) {
  const createdDate = layout.createdDate || layout.lastUpdated || '—';

  if (!gisSummary.hasGisData) {
    return (
      <section className="layout-dashboard-panels">
        <EmptyState
          icon={<FiMap />}
          title={LAYOUT_MESSAGES.noTownshipDataTitle}
          description={LAYOUT_MESSAGES.noTownshipDataDescription}
          action={
            <div className="layout-dashboard-panels__empty-actions">
              <Button variant="accent" size="md" onClick={onImport}>
                <FiUploadCloud /> {LAYOUT_LABELS.importGisWorkbook}
              </Button>
              <Button variant="soft" size="md" onClick={onGenerate}>
                <FiGrid /> {LAYOUT_LABELS.generateTownship}
              </Button>
            </div>
          }
        />
      </section>
    );
  }

  return (
    <section className="layout-dashboard-panels">
      <div className="layout-dashboard-panels__group">
        <h2 className="layout-dashboard-panels__heading">Layout Information</h2>
        <InfoCard
          title="Layout Information"
          items={[
            { label: 'Layout Name', value: layout.name },
            { label: 'Venture', value: layout.ventureName || venture?.name },
            { label: 'Location', value: location || '—' },
            { label: 'Area', value: formatArea(layout.totalArea) },
            { label: 'Approval', value: layout.approvalNumber || layout.approval || '—' },
            { label: 'Status', value: layout.status },
            { label: 'Created', value: createdDate },
          ]}
        />
      </div>

      <div className="layout-dashboard-panels__group">
        <h2 className="layout-dashboard-panels__heading">GIS Summary</h2>
        <div className="layout-dashboard-panels__gis-grid">
          <SummaryCard icon={<FiGrid />} label="Total Plots" value={gisSummary.plots} tone="accent" />
          <SummaryCard icon={<FiMap />} label="Roads" value={gisSummary.roads} tone="primary" />
          <SummaryCard icon={<FiHeart />} label="Amenities" value={gisSummary.amenities} tone="success" />
          <SummaryCard icon={<FiTool />} label="Utilities" value={gisSummary.utilities} tone="warning" />
          <SummaryCard icon={<FiSun />} label="Landscaping" value={gisSummary.landscaping} tone="violet" />
          <SummaryCard icon={<FiLayers />} label="Blocks" value={gisSummary.blocks} tone="info" />
        </div>
      </div>

      <div className="layout-dashboard-panels__group">
        <h2 className="layout-dashboard-panels__heading">Sales Summary</h2>
        <div className="layout-dashboard-panels__sales-grid">
          <SummaryCard icon={<FiCheckCircle />} label="Available" value={plots.available || 0} tone="success" />
          <SummaryCard icon={<FiBookmark />} label="Reserved" value={plots.reserved || 0} tone="violet" />
          <SummaryCard icon={<FiClock />} label="Booked" value={plots.booked || 0} tone="warning" />
          <SummaryCard icon={<FiTag />} label="Sold" value={plots.sold || 0} tone="info" />
          <SummaryCard icon={<FiAlertCircle />} label="Blocked" value={plots.blocked || 0} tone="primary" />
        </div>
      </div>

      <div className="layout-dashboard-panels__group">
        <h2 className="layout-dashboard-panels__heading">Recent Activity</h2>
        <div className="layout-dashboard-panels__activity">
          <LayoutTimeline activities={layout.activities} />
        </div>
      </div>
    </section>
  );
}
