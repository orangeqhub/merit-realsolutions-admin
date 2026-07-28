import { memo } from 'react';
import { FiInbox, FiMap, FiFilter, FiClock, FiLayers } from 'react-icons/fi';

const ICONS = {
  default: FiInbox,
  map: FiMap,
  filter: FiFilter,
  activity: FiClock,
  layers: FiLayers,
};

function WorkspaceEmptyState({
  title = 'Nothing here yet',
  description = '',
  icon = 'default',
  compact = false,
  className = '',
}) {
  const Icon = ICONS[icon] || ICONS.default;

  return (
    <div className={`ws-p1-empty${compact ? ' ws-p1-empty--compact' : ''} ${className}`.trim()}>
      <span className="ws-p1-empty__icon" aria-hidden>
        <Icon />
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export default memo(WorkspaceEmptyState);
