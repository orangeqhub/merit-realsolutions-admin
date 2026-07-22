import { useMemo, useState } from 'react';
import { FiMap, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import EmptyState from '../../components/layout/EmptyState';
import MapWorkspace from '../../features/plot-map/MapWorkspace';

export default function VentureLayoutsPanel({ venture, layouts = [] }) {
  const navigate = useNavigate();
  const [activeLayoutId, setActiveLayoutId] = useState(layouts[0]?.id || '');

  const activeLayout = useMemo(
    () => layouts.find((l) => l.id === activeLayoutId) || layouts[0] || null,
    [layouts, activeLayoutId]
  );

  if (!layouts.length) {
    return (
      <EmptyState
        title="No layouts yet"
        description="Create the first layout for this venture to start placing plots on the map."
        action={
          <Button variant="accent" size="md" to={`/dashboard/layouts/new?venture=${venture.id}`}>
            <FiPlus /> Create Layout
          </Button>
        }
      />
    );
  }

  return (
    <div className="venture-layouts-panel">
      <div className="venture-layouts-panel__picker">
        <div className="venture-layouts-panel__chips">
          {layouts.map((layout) => (
            <button
              key={layout.id}
              type="button"
              className={`venture-layouts-panel__chip ${activeLayout?.id === layout.id ? 'is-active' : ''}`}
              onClick={() => setActiveLayoutId(layout.id)}
            >
              {layout.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" to={`/dashboard/layouts/new?venture=${venture.id}`}>
            <FiPlus /> Add Layout
          </Button>
          {activeLayout ? (
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate(`/dashboard/layouts/${activeLayout.id}/workspace`)}
            >
              <FiMap /> Full Workspace
            </Button>
          ) : null}
        </div>
      </div>

      <MapWorkspace layout={activeLayout} venture={venture} />
    </div>
  );
}
