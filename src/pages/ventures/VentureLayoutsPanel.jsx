import { useMemo, useState } from 'react';
import { FiMap, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import EmptyState from '../../components/layout/EmptyState';
import MapWorkspace from '../../features/plot-map/MapWorkspace';
import { layoutService } from '../../shared/services/layoutService.js';

/** Venture Details → Layouts tab. Production MapWorkspace only (no parallel premium screen). */
export default function VentureLayoutsPanel({ venture, layouts = [] }) {
  const navigate = useNavigate();
  const [activeLayoutId, setActiveLayoutId] = useState(layouts[0]?.id || '');

  const activeLayout = useMemo(() => {
    const fromList = layouts.find((l) => l.id === activeLayoutId) || layouts[0] || null;
    if (!fromList) return null;
    // Map engines need the persisted layout record, not a Venture-merged view.
    return layoutService.getById(fromList.id) || fromList;
  }, [layouts, activeLayoutId]);

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
        <div className="venture-layouts-panel__actions">
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

      <MapWorkspace layout={activeLayout} venture={venture} className="venture-layouts-panel__map" />
    </div>
  );
}
