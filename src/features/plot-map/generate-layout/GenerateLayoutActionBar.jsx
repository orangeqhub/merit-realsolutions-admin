import {
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiRotateCcw,
  FiSave,
} from 'react-icons/fi';
import Button from '../../../components/ui/button/Button';

function ActionMetric({ label, value, highlight = false }) {
  return (
    <div className={`ui31-gen-metric${highlight ? ' ui31-gen-metric--highlight' : ''}`}>
      <span className="ui31-gen-metric__label">{label}</span>
      <strong className="ui31-gen-metric__value">{value ?? '—'}</strong>
    </div>
  );
}

/** UI31_GENERATE_LAYOUT_POLISH_COMPLETE */
export default function GenerateLayoutActionBar({
  hasPreview = false,
  estimatedPlots = '—',
  estimatedRevenue = null,
  plotSizeLabel = '—',
  isGenerating = false,
  isSaving = false,
  canGenerate = true,
  onGeneratePreview,
  onSaveLayout,
  onExportExcel,
  onRegenerate,
  onReset,
}) {
  return (
    <div className="ui31-gen-action-bar">
      <div className="ui31-gen-action-bar__metrics" aria-live="polite">
        {!hasPreview ? (
          <>
            <ActionMetric label="Estimated Plots" value={estimatedPlots} />
            <ActionMetric label="Est. Revenue" value={estimatedRevenue || '—'} />
            <ActionMetric label="Plot Size" value={plotSizeLabel} />
          </>
        ) : (
          <ActionMetric label="Estimated Plots" value={estimatedPlots} highlight />
        )}
      </div>

      <div className="ui31-gen-action-bar__divider" aria-hidden />

      {!hasPreview ? (
        <div className="ui31-gen-action-bar__controls">
          <Button
            variant="accent"
            size="md"
            className="ui31-gen-action-bar__primary"
            onClick={onGeneratePreview}
            disabled={isGenerating || !canGenerate}
          >
            <FiEye /> {isGenerating ? 'Generating…' : 'Generate Preview'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} disabled={isGenerating}>
            <FiRotateCcw /> Reset
          </Button>
        </div>
      ) : (
        <div className="ui31-gen-action-bar__controls ui31-gen-action-bar__controls--post">
          <Button
            variant="accent"
            size="md"
            className="ui31-gen-action-bar__primary"
            onClick={onSaveLayout}
            disabled={isSaving || isGenerating}
          >
            <FiSave /> {isSaving ? 'Saving…' : 'Save Layout'}
          </Button>
          <div className="ui31-gen-action-bar__secondary">
            <Button variant="soft" size="sm" onClick={onExportExcel} disabled={isGenerating}>
              <FiDownload /> Export Excel
            </Button>
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isGenerating}>
              <FiRefreshCw /> Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset} disabled={isGenerating}>
              <FiRotateCcw /> Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
