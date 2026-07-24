import { useMemo } from 'react';
import { FiDownload, FiEye, FiRefreshCw, FiRotateCcw, FiSave } from 'react-icons/fi';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Switch from '../../components/ui/switch/Switch';
import RightDrawer from '../../components/drawer/RightDrawer';
import LayoutHealthCard from './LayoutHealthCard';
import { LayoutGenerationService, AMENITY_TYPES, DEFAULT_AMENITIES } from '../../services/layoutGeneration';

function formatArea(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toLocaleString()} Sq.Yds`;
}

const AMENITY_ORDER = ['park', 'clubHouse', 'openSpace', 'temple', 'swimmingPool'];

export default function GenerateLayoutDrawer({
  open,
  onClose,
  form,
  setForm,
  onGeneratePreview,
  onResetPreview,
  onRegenerate,
  onSaveLayout,
  onExportExcel,
  plotCount = 0,
  roadCount = 0,
  amenityCount = 0,
  previewSummary = null,
  layoutHealth = null,
  generationTimeMs = null,
  isGenerating = false,
  isSaving = false,
  errors = [],
  fieldErrors = {},
  onViewHealthIssues,
  onHighlightHealthIssue,
}) {
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setAmenity = (key, checked) =>
    setForm((prev) => ({
      ...prev,
      amenities: { ...(prev.amenities || DEFAULT_AMENITIES), [key]: checked },
    }));

  const liveEstimate = useMemo(
    () => LayoutGenerationService.estimateStatistics(form),
    [form]
  );

  const liveValidation = useMemo(
    () => LayoutGenerationService.validateParams(form),
    [form]
  );

  const displaySummary = previewSummary || liveEstimate.summary;
  const showStats = displaySummary && liveEstimate.valid;
  const estimatedPlotCount = displaySummary?.plots ?? 0;

  const mergedFieldErrors = {
    ...liveValidation.fieldErrors,
    ...fieldErrors,
  };

  const getError = (field) => mergedFieldErrors[field] || '';

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="Generate Layout"
      subtitle="Configure blocks, roads, and amenities — the system calculates plot positions automatically."
      size="md"
      overlayMode="transparent"
      footer={
        <div className="plot-map-drawer__footer plot-map-drawer__footer--stack">
          <Button variant="accent" size="md" onClick={onGeneratePreview} disabled={isGenerating}>
            <FiEye /> {isGenerating ? 'Generating…' : 'Generate Preview'}
          </Button>
          <Button variant="soft" size="md" onClick={onRegenerate} disabled={!plotCount || isGenerating}>
            <FiRefreshCw /> Regenerate
          </Button>
          <Button variant="ghost" size="md" onClick={onResetPreview} disabled={!plotCount || isGenerating}>
            <FiRotateCcw /> Reset Preview
          </Button>
          <Button variant="ghost" size="md" onClick={onExportExcel} disabled={!plotCount || isGenerating}>
            <FiDownload /> Export Excel
          </Button>
          <Button
            variant="accent"
            size="md"
            onClick={onSaveLayout}
            disabled={!plotCount || isSaving || isGenerating}
          >
            <FiSave /> {isSaving ? 'Saving…' : 'Save Layout'}
          </Button>
        </div>
      }
    >
      <div className="plot-map-drawer__form plot-map-drawer__form--layout-generate">
        {isGenerating ? (
          <div className="plot-generate-drawer__progress" role="status">
            <span className="plot-generate-drawer__progress-bar" />
            Generating layout preview…
          </div>
        ) : null}

        {errors.length > 0 && (
          <div className="plot-generate-drawer__errors" role="alert">
            {errors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        {plotCount > 0 && (
          <p className="plot-generate-drawer__hint plot-generate-drawer__hint--success">
            {plotCount} plots, {roadCount} roads, {amenityCount} amenities previewing on the map.
            {generationTimeMs != null ? ` Generated in ${generationTimeMs} ms.` : ''}
          </p>
        )}

        {showStats ? (
          <div className="plot-generate-drawer__stats">
            <p className="plot-generate-drawer__stats-title">Layout Summary</p>
            <div className="plot-generate-drawer__stats-grid">
              <div>
                <span className="plot-generate-drawer__stats-label">Est. Plots</span>
                <strong>{estimatedPlotCount}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Blocks</span>
                <strong>{displaySummary.blocks}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Roads</span>
                <strong>{displaySummary.roads}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Amenities</span>
                <strong>{displaySummary.amenities}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Saleable Area</span>
                <strong>{formatArea(displaySummary.saleableAreaSqYds ?? displaySummary.estimatedArea)}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Road Area</span>
                <strong>{formatArea(displaySummary.roadAreaSqYds)}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Amenity Area</span>
                <strong>{formatArea(displaySummary.amenityAreaSqYds)}</strong>
              </div>
              <div>
                <span className="plot-generate-drawer__stats-label">Total Layout</span>
                <strong>{formatArea(displaySummary.totalLayoutAreaSqYds)}</strong>
              </div>
            </div>
          </div>
        ) : null}

        {layoutHealth ? (
          <LayoutHealthCard
            health={layoutHealth}
            onViewIssues={onViewHealthIssues}
            onHighlightIssue={onHighlightHealthIssue}
          />
        ) : null}

        <div className="plot-generate-drawer__section-label">Blocks</div>

        <Input
          label="Number of Blocks"
          type="number"
          min={1}
          max={10}
          required
          value={form.numberOfBlocks}
          onChange={(e) => setField('numberOfBlocks', e.target.value)}
          error={getError('numberOfBlocks')}
          hint="Each block gets its own plot grid and numbering (A101, B101…)"
        />
        <Input
          label="Block Prefix"
          required
          value={form.blockPrefix}
          onChange={(e) => setField('blockPrefix', e.target.value)}
          placeholder="A"
          error={getError('blockPrefix')}
        />
        <Input
          label="Spacing Between Blocks (feet)"
          type="number"
          min={0}
          step="any"
          required
          value={form.blockSpacing}
          onChange={(e) => setField('blockSpacing', e.target.value)}
          error={getError('blockSpacing')}
        />

        <div className="plot-generate-drawer__section-label">Plot grid (per block)</div>

        <Input
          label="Number of Rows"
          type="number"
          min={1}
          max={100}
          required
          value={form.rows}
          onChange={(e) => setField('rows', e.target.value)}
          error={getError('rows')}
        />
        <Input
          label="Number of Columns"
          type="number"
          min={1}
          max={100}
          required
          value={form.columns}
          onChange={(e) => setField('columns', e.target.value)}
          error={getError('columns')}
        />
        <Input
          label="Starting Plot Number"
          type="number"
          min={1}
          required
          value={form.startingPlotNumber}
          onChange={(e) => setField('startingPlotNumber', e.target.value)}
          error={getError('startingPlotNumber')}
        />
        <Input
          label="Plot Width (feet)"
          type="number"
          min={1}
          step="any"
          required
          value={form.plotWidthFeet}
          onChange={(e) => setField('plotWidthFeet', e.target.value)}
          error={getError('plotWidthFeet')}
        />
        <Input
          label="Plot Height (feet)"
          type="number"
          min={1}
          step="any"
          required
          value={form.plotHeightFeet}
          onChange={(e) => setField('plotHeightFeet', e.target.value)}
          error={getError('plotHeightFeet')}
        />
        <Input
          label="Default Rate / Sq.Yd (₹)"
          type="number"
          min={0}
          step="any"
          value={form.defaultRatePerSqYard}
          onChange={(e) => setField('defaultRatePerSqYard', e.target.value)}
          hint="Optional — used for generated plot pricing and Excel export"
        />

        <div className="plot-generate-drawer__section-label">Roads (automatic)</div>

        <Input
          label="Road After Every Rows"
          type="number"
          min={1}
          max={50}
          required
          value={form.roadEveryRows}
          onChange={(e) => setField('roadEveryRows', e.target.value)}
          error={getError('roadEveryRows')}
        />
        <Input
          label="Road After Every Columns"
          type="number"
          min={1}
          max={50}
          required
          value={form.roadEveryColumns}
          onChange={(e) => setField('roadEveryColumns', e.target.value)}
          error={getError('roadEveryColumns')}
        />
        <Input
          label="Main Road Width (feet)"
          type="number"
          min={1}
          step="any"
          required
          value={form.mainRoadWidth}
          onChange={(e) => setField('mainRoadWidth', e.target.value)}
          error={getError('mainRoadWidth')}
        />
        <Input
          label="Internal Road Width (feet)"
          type="number"
          min={1}
          step="any"
          required
          value={form.internalRoadWidth}
          onChange={(e) => setField('internalRoadWidth', e.target.value)}
          error={getError('internalRoadWidth')}
        />
        <Input
          label="Service Road Width (feet)"
          type="number"
          min={1}
          step="any"
          value={form.serviceRoadWidth}
          onChange={(e) => setField('serviceRoadWidth', e.target.value)}
          error={getError('serviceRoadWidth')}
        />
        <Switch
          label="Enable service roads between column groups"
          checked={Boolean(form.enableServiceRoads)}
          onChange={(checked) => setField('enableServiceRoads', checked)}
        />

        <div className="plot-generate-drawer__section-label">Amenities (automatic)</div>

        <div className="plot-generate-drawer__amenities">
          {AMENITY_ORDER.map((key) => (
            <Switch
              key={key}
              label={AMENITY_TYPES[key].label}
              checked={Boolean(form.amenities?.[key])}
              onChange={(checked) => setAmenity(key, checked)}
            />
          ))}
        </div>

        <div className="plot-generate-drawer__section-label">Layout center</div>

        <Input
          label="Center Latitude"
          type="number"
          step="any"
          required
          value={form.startingLatitude}
          onChange={(e) => setField('startingLatitude', e.target.value)}
          error={getError('startingLatitude')}
        />
        <Input
          label="Center Longitude"
          type="number"
          step="any"
          required
          value={form.startingLongitude}
          onChange={(e) => setField('startingLongitude', e.target.value)}
          error={getError('startingLongitude')}
        />
      </div>
    </RightDrawer>
  );
}
