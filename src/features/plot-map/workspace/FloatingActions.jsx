import { memo } from 'react';
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
} from 'react-icons/fi';

function ActionBtn({ icon: Icon, label, enabled, onClick, accent }) {
  return (
    <button
      type="button"
      className={`ws-float-actions__btn ${accent ? 'is-accent' : ''} ${!enabled ? 'is-disabled' : ''}`}
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={enabled ? label : 'Coming Soon'}
      aria-label={enabled ? label : `${label} — Coming Soon`}
    >
      <Icon />
      <span>{label}</span>
    </button>
  );
}

function FloatingActions({
  onQueryFocus,
  onGenerate,
  onImport,
  onAddPlot,
  onSave,
  onExport,
  generatedPreviewCount = 0,
}) {
  return (
    <motion.div
      className="ws-float-actions"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      role="toolbar"
      aria-label="Workspace actions"
    >
      <ActionBtn icon={FiSearch} label="Query" enabled onClick={onQueryFocus} />
      <ActionBtn icon={FiNavigation} label="Route" enabled={false} />
      <ActionBtn icon={FiShare2} label="Share" enabled={false} />
      <ActionBtn icon={FiDownload} label="Export" enabled={Boolean(onExport)} onClick={onExport} />
      <ActionBtn icon={FiBox} label="3D" enabled={false} />
      <ActionBtn icon={FiSettings} label="Settings" enabled={false} />
      <span className="ws-float-actions__sep" aria-hidden />
      <ActionBtn icon={FiGrid} label={generatedPreviewCount ? `Generate (${generatedPreviewCount})` : 'Generate'} enabled onClick={onGenerate} accent />
      <ActionBtn icon={FiUploadCloud} label="Import" enabled={Boolean(onImport)} onClick={onImport} />
      <ActionBtn icon={FiPlus} label="Add Plot" enabled onClick={onAddPlot} />
      <ActionBtn icon={FiSave} label="Save" enabled onClick={onSave} accent />
    </motion.div>
  );
}

export default memo(FloatingActions);
