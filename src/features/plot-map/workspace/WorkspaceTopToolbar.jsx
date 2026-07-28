import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiNavigation,
  FiShare2,
  FiDownload,
  FiBox,
  FiSettings,
  FiGrid,
  FiPlus,
  FiSave,
  FiUploadCloud,
  FiRotateCcw,
  FiRotateCw,
  FiMapPin,
} from 'react-icons/fi';
import { LAYOUT_LABELS } from '../../../pages/layouts/layoutTerminology';

function ToolbarBtn({ icon: Icon, label, enabled = true, onClick, accent, primary }) {
  return (
    <button
      type="button"
      className={[
        'ws-p1-toolbar__btn',
        accent ? 'is-accent' : '',
        primary ? 'is-primary' : '',
        !enabled ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={enabled ? label : `${label} — Coming Soon`}
      aria-label={enabled ? label : `${label} — Coming Soon`}
    >
      <Icon aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function WorkspaceTopToolbar({
  layoutName,
  searchInputRef,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  importHref,
  onQueryFocus,
  onGenerate,
  onImport,
  onAddPlot,
  onSave,
  onExport,
  generatedPreviewCount = 0,
}) {
  return (
    <motion.header
      className="ws-p1-toolbar"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      role="toolbar"
      aria-label="Workspace toolbar"
    >
      <div className="ws-p1-toolbar__cluster ws-p1-toolbar__cluster--brand">
        <span className="ws-p1-toolbar__badge">
          <FiMapPin aria-hidden />
        </span>
        <div className="ws-p1-toolbar__title-wrap">
          <span className="ws-p1-toolbar__eyebrow">Layout Workspace</span>
          <strong className="ws-p1-toolbar__title">{layoutName || 'Untitled Layout'}</strong>
        </div>
      </div>

      <form
        className="ws-p1-toolbar__search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit?.();
        }}
      >
        <FiSearch className="ws-p1-toolbar__search-icon" aria-hidden />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search plot number…"
          aria-label="Search plot number"
        />
      </form>

      <div className="ws-p1-toolbar__cluster ws-p1-toolbar__cluster--history">
        <button
          type="button"
          className="ws-p1-toolbar__icon-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          aria-label="Undo"
        >
          <FiRotateCcw />
        </button>
        <button
          type="button"
          className="ws-p1-toolbar__icon-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          aria-label="Redo"
        >
          <FiRotateCw />
        </button>
      </div>

      <div className="ws-p1-toolbar__divider" aria-hidden />

      <div className="ws-p1-toolbar__cluster ws-p1-toolbar__cluster--tools">
        <ToolbarBtn icon={FiSearch} label="Query" enabled onClick={onQueryFocus} />
        <ToolbarBtn icon={FiNavigation} label="Route" enabled={false} />
        <ToolbarBtn icon={FiShare2} label="Share" enabled={false} />
        <ToolbarBtn icon={FiDownload} label={LAYOUT_LABELS.exportGisWorkbook} enabled={Boolean(onExport)} onClick={onExport} />
        <ToolbarBtn icon={FiBox} label="3D" enabled={false} />
        <ToolbarBtn icon={FiSettings} label="Settings" enabled={false} />
      </div>

      <div className="ws-p1-toolbar__divider" aria-hidden />

      <div className="ws-p1-toolbar__cluster ws-p1-toolbar__cluster--actions">
        <ToolbarBtn
          icon={FiGrid}
          label={generatedPreviewCount ? `${LAYOUT_LABELS.generateTownship} (${generatedPreviewCount})` : LAYOUT_LABELS.generateTownship}
          enabled
          onClick={onGenerate}
          primary
        />
        {importHref ? (
          <Link className="ws-p1-toolbar__link-btn" to={importHref}>
            <FiUploadCloud aria-hidden />
            <span>Plots</span>
          </Link>
        ) : null}
        <ToolbarBtn icon={FiUploadCloud} label={LAYOUT_LABELS.importGisWorkbook} enabled={Boolean(onImport)} onClick={onImport} />
        <ToolbarBtn icon={FiPlus} label="Add Plot" enabled onClick={onAddPlot} />
        <ToolbarBtn icon={FiSave} label="Save" enabled onClick={onSave} accent />
      </div>
    </motion.header>
  );
}

export default memo(WorkspaceTopToolbar);
