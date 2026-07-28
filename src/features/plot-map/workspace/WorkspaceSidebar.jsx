import { memo, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiChevronRight, FiSidebar } from 'react-icons/fi';

const WorkspaceLegend = lazy(() => import('./WorkspaceLegend'));
const WorkspaceFilters = lazy(() => import('./WorkspaceFilters'));
const WorkspaceQuickStats = lazy(() => import('./WorkspaceQuickStats'));
const MiniMap = lazy(() => import('./MiniMap'));

import WorkspaceEmptyState from './WorkspaceEmptyState';

const SECTIONS = [
  { id: 'minimap', title: 'Mini Layout', icon: '🗺' },
  { id: 'legend', title: 'Legend', icon: '◼' },
  { id: 'filters', title: 'Filters', icon: '⧉' },
  { id: 'stats', title: 'Quick Statistics', icon: '▤' },
  { id: 'activity', title: 'Recent Activity', icon: '◷' },
  { id: 'history', title: 'Selected Plot History', icon: '↺' },
];

function Section({ id, title, icon, open, onToggle, children }) {
  return (
    <div className="ws-sidebar__section">
      <button type="button" className="ws-sidebar__section-head" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="ws-sidebar__section-label">
          <span className="ws-sidebar__section-icon" aria-hidden>{icon}</span>
          {title}
        </span>
        {open ? <FiChevronDown /> : <FiChevronRight />}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="ws-sidebar__section-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ws-sidebar__section-inner">
              <div className="ws-p1-card">{children}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function WorkspaceSidebar({
  collapsed,
  onToggleCollapsed,
  plots,
  filteredPlots,
  metrics,
  statusFilters,
  onToggleStatus,
  onHoverStatus,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  filters,
  onFiltersChange,
  filterOptions,
  viewport,
  mapCenter,
  miniMapRoads = [],
  miniMapAmenities = [],
  miniMapBoundary = [],
  onMiniMapNavigate,
  selectedPlot,
}) {
  const [openSections, setOpenSections] = useState({
    minimap: true,
    legend: true,
    filters: true,
    stats: true,
    activity: false,
    history: true,
  });

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const recentActivity = (plots || [])
    .flatMap((plot) =>
      (plot.history || []).slice(0, 1).map((event) => ({
        id: `${plot.id}-${event.date}-${event.title}`,
        plotNumber: plot.plotNumber,
        ...event,
      }))
    )
    .slice(0, 8);

  return (
    <aside className={`ws-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Workspace sidebar">
      <div className="ws-sidebar__chrome">
        <button
          type="button"
          className="ws-sidebar__collapse"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <FiSidebar />
        </button>
        {!collapsed ? <h2 className="ws-sidebar__title">Workspace</h2> : null}
      </div>

      {!collapsed ? (
        <div className="ws-sidebar__scroll">
          <Suspense fallback={<WorkspaceEmptyState title="Loading panel…" description="Fetching sidebar modules" compact />}>
            <Section id="minimap" title="Mini Layout" icon={SECTIONS[0].icon} open={openSections.minimap} onToggle={toggleSection}>
              <MiniMap
                plots={filteredPlots}
                roads={miniMapRoads}
                amenities={miniMapAmenities}
                boundary={miniMapBoundary}
                viewport={viewport}
                center={mapCenter}
                onNavigate={onMiniMapNavigate}
              />
            </Section>

            <Section id="legend" title="Legend" icon={SECTIONS[1].icon} open={openSections.legend} onToggle={toggleSection}>
              <WorkspaceLegend
                plots={plots}
                activeStatuses={statusFilters}
                onToggleStatus={onToggleStatus}
                onHoverStatus={onHoverStatus}
              />
            </Section>

            <Section id="filters" title="Filters" icon={SECTIONS[2].icon} open={openSections.filters} onToggle={toggleSection}>
              <WorkspaceFilters
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
                filters={filters}
                onFiltersChange={onFiltersChange}
                options={filterOptions}
                statusFilters={statusFilters}
                onToggleStatus={onToggleStatus}
              />
            </Section>

            <Section id="stats" title="Quick Statistics" icon={SECTIONS[3].icon} open={openSections.stats} onToggle={toggleSection}>
              <WorkspaceQuickStats metrics={metrics} />
            </Section>

            <Section id="activity" title="Recent Activity" icon={SECTIONS[4].icon} open={openSections.activity} onToggle={toggleSection}>
              {recentActivity.length ? (
                <ul className="ws-activity">
                  {recentActivity.map((item) => (
                    <li key={item.id}>
                      <strong>Plot {item.plotNumber}</strong>
                      <span>{item.title}</span>
                      <small>{item.date}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <WorkspaceEmptyState
                  icon="activity"
                  title="No recent activity"
                  description="Plot events will appear here as your team works the layout."
                  compact
                />
              )}
            </Section>

            <Section id="history" title="Selected Plot History" icon={SECTIONS[5].icon} open={openSections.history} onToggle={toggleSection}>
              {selectedPlot?.history?.length ? (
                <ul className="ws-activity">
                  {selectedPlot.history.slice(0, 8).map((event, index) => (
                    <li key={`${event.date}-${index}`}>
                      <strong>{event.title}</strong>
                      <span>{event.description || '—'}</span>
                      <small>{event.date}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <WorkspaceEmptyState
                  icon="activity"
                  title={selectedPlot ? 'No history for this plot' : 'No plot selected'}
                  description={selectedPlot ? 'This plot has no recorded timeline yet.' : 'Click a plot on the map to inspect its history.'}
                  compact
                />
              )}
            </Section>
          </Suspense>
        </div>
      ) : (
        <div className="ws-sidebar__rail" aria-hidden>
          {SECTIONS.map((s) => (
            <span key={s.id} title={s.title} />
          ))}
        </div>
      )}
    </aside>
  );
}

export default memo(WorkspaceSidebar);
