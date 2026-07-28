import { memo } from 'react';

function Field({ label, children }) {
  return (
    <label className="ws-filters__field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function WorkspaceFilters({
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  filters,
  onFiltersChange,
  options = {},
  statusFilters = [],
  onToggleStatus,
}) {
  const set = (key, value) => onFiltersChange?.({ ...filters, [key]: value });

  return (
    <form
      className="ws-filters"
      onSubmit={(e) => {
        e.preventDefault();
        onSearchSubmit?.();
      }}
    >
      <Field label="Search Plot Number">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="e.g. P-012"
          aria-label="Search plot number"
        />
      </Field>

      <div className="ws-filters__status">
        <span className="ws-filters__section-label">Status</span>
        <div className="ws-filters__chips">
          {['Available', 'Reserved', 'Booked', 'Sold', 'Blocked'].map((status) => {
            const active = statusFilters.includes(status);
            return (
              <button
                key={status}
                type="button"
                className={`ws-filters__chip ${active ? 'is-active' : ''}`}
                onClick={() => onToggleStatus?.(status)}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Facing">
        <select value={filters.facing || ''} onChange={(e) => set('facing', e.target.value)}>
          <option value="">All</option>
          {(options.facings || []).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Field>

      <Field label="Block">
        <select value={filters.block || ''} onChange={(e) => set('block', e.target.value)}>
          <option value="">All</option>
          {(options.blocks || []).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </Field>

      <div className="ws-filters__row">
        <Field label="Min Area">
          <input type="number" min="0" value={filters.minArea || ''} onChange={(e) => set('minArea', e.target.value)} placeholder="Sq.Yd" />
        </Field>
        <Field label="Max Area">
          <input type="number" min="0" value={filters.maxArea || ''} onChange={(e) => set('maxArea', e.target.value)} placeholder="Sq.Yd" />
        </Field>
      </div>

      <div className="ws-filters__row">
        <Field label="Min Price">
          <input type="number" min="0" value={filters.minPrice || ''} onChange={(e) => set('minPrice', e.target.value)} placeholder="₹" />
        </Field>
        <Field label="Max Price">
          <input type="number" min="0" value={filters.maxPrice || ''} onChange={(e) => set('maxPrice', e.target.value)} placeholder="₹" />
        </Field>
      </div>

      <Field label="Availability">
        <select value={filters.availability || ''} onChange={(e) => set('availability', e.target.value)}>
          <option value="">All</option>
          <option value="available">Available only</option>
          <option value="unavailable">Not available</option>
        </select>
      </Field>

      <Field label="Road Width">
        <select value={filters.roadWidth || ''} onChange={(e) => set('roadWidth', e.target.value)}>
          <option value="">All</option>
          {(options.roadWidths || []).map((w) => (
            <option key={w} value={w}>{w} ft</option>
          ))}
        </select>
      </Field>

      <label className="ws-filters__check">
        <input
          type="checkbox"
          checked={Boolean(filters.cornerOnly)}
          onChange={(e) => set('cornerOnly', e.target.checked)}
        />
        <span>Corner plot only</span>
      </label>

      <button
        type="button"
        className="ws-filters__reset"
        onClick={() =>
          onFiltersChange?.({
            facing: '',
            block: '',
            minArea: '',
            maxArea: '',
            minPrice: '',
            maxPrice: '',
            roadWidth: '',
            cornerOnly: false,
            availability: '',
          })
        }
      >
        Reset filters
      </button>
    </form>
  );
}

export default memo(WorkspaceFilters);
