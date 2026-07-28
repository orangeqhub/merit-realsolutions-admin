import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Button from '../../components/ui/button/Button';
import EmptyState from '../../components/layout/EmptyState';
import MapWorkspace from '../../features/plot-map/MapWorkspace';
import { useLayouts } from '../../context/LayoutsContext';
import { useVentures } from '../../context/VenturesContext';
import './layout.css';

export default function LayoutMapWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Raw layout for MapWorkspace (do not pass Venture-merged view into map engines).
  const { getLayoutRecord } = useLayouts();
  const { getVenture } = useVentures();
  const layout = getLayoutRecord(id);
  const venture = useMemo(
    () => (layout ? getVenture(layout.ventureId) : null),
    [getVenture, layout]
  );

  if (!layout) {
    return (
      <EmptyState
        title="Layout not found"
        description="This layout may have been removed."
        action={
          <Button variant="accent" size="md" to="/dashboard/layouts/list">
            Back to Layouts
          </Button>
        }
      />
    );
  }

  return (
    <div className="layout-page layout-map-workspace-page">
      <div className="layout-map-workspace-page__nav">
        <Breadcrumb
          items={[
            { label: 'Layouts', to: '/dashboard/layouts/list' },
            { label: layout.name, to: `/dashboard/layouts/${layout.id}` },
            { label: 'Map Workspace' },
          ]}
        />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/layouts/${layout.id}`)}>
            <FiArrowLeft /> Layout Details
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/ventures/${layout.ventureId}?tab=layouts`)}>
            Venture Layouts
          </Button>
        </div>
      </div>

      <MapWorkspace layout={layout} venture={venture} />
    </div>
  );
}
