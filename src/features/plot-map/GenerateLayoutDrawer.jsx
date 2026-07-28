/** UI31_GENERATE_LAYOUT_POLISH_COMPLETE */
import { useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronUp,
  FiDroplet,
  FiGrid,
  FiHome,
  FiLayers,
  FiMapPin,
  FiMaximize2,
  FiSettings,
  FiStar,
  FiSun,
} from 'react-icons/fi';
import Input from '../../components/ui/input/Input';
import RightDrawer from '../../components/drawer/RightDrawer';
import LayoutHealthCard from './LayoutHealthCard';
import GenerateLayoutSection from './generate-layout/GenerateLayoutSection';
import GenerateLayoutSummary from './generate-layout/GenerateLayoutSummary';
import GenerateLayoutActionBar from './generate-layout/GenerateLayoutActionBar';
import { resolveLayoutPricingDefaults } from '../../shared/services/layoutView.js';
import { formatSqYardPrice } from '../../pages/ventures/constants';
import {
  LayoutGenerationService,
  AMENITY_TYPES,
  DEFAULT_AMENITIES,
} from '../../services/layoutGeneration';
import { countRoads } from '../../services/layoutGeneration/StatisticsGenerator.js';
import { LAYOUT_LABELS } from '../../pages/layouts/layoutTerminology';

const AMENITY_ORDER = ['park', 'clubHouse', 'temple', 'swimmingPool', 'openSpace'];

const AMENITY_ICONS = {
  park: FiSun,
  clubHouse: FiHome,
  temple: FiStar,
  swimmingPool: FiDroplet,
  openSpace: FiMaximize2,
};

function plotAreaSqYd(widthFt, heightFt) {
  const w = Number(widthFt);
  const h = Number(heightFt);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return Math.round(((w * h) / 9) * 100) / 100;
}

function formatRevenueShort(value) {
  if (!value || !Number.isFinite(value)) return null;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export default function GenerateLayoutDrawer({
  open,
  onClose,
  form,
  setForm,
  venture = null,
  layout = null,
  onGeneratePreview,
  onResetPreview,
  onResetForm,
  onRegenerate,
  onSaveLayout,
  onExportExcel,
  plotCount = 0,
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rateOverride, setRateOverride] = useState(false);

  const hasPreview = plotCount > 0;
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setAmenity = (key, checked) =>
    setForm((prev) => ({
      ...prev,
      amenities: { ...(prev.amenities || DEFAULT_AMENITIES), [key]: checked },
    }));

  const pricingDefaults = useMemo(
    () => resolveLayoutPricingDefaults(layout, venture),
    [layout, venture]
  );

  const inheritedRate =
    Number(pricingDefaults.currentPrice ?? pricingDefaults.defaultRatePerSqYard) || 0;

  const liveEstimate = useMemo(
    () => LayoutGenerationService.estimateStatistics(form),
    [form]
  );

  const liveValidation = useMemo(
    () => LayoutGenerationService.validateParams(form),
    [form]
  );

  const roadCounts = useMemo(() => {
    if (!liveEstimate.valid) return null;
    try {
      return countRoads(form);
    } catch {
      return null;
    }
  }, [form, liveEstimate.valid]);

  const displaySummary = previewSummary || liveEstimate.summary;
  const plotArea = plotAreaSqYd(form.plotWidthFeet, form.plotHeightFeet);

  const effectiveRate = rateOverride
    ? Number(form.defaultRatePerSqYard) || 0
    : inheritedRate || Number(form.defaultRatePerSqYard) || 0;

  const estimatedRevenue =
    displaySummary?.saleableAreaSqYds && effectiveRate
      ? displaySummary.saleableAreaSqYds * effectiveRate
      : null;

  const mergedFieldErrors = {
    ...liveValidation.fieldErrors,
    ...fieldErrors,
  };

  const getError = (field) => mergedFieldErrors[field] || '';

  const handleReset = () => {
    onResetForm?.();
    onResetPreview?.();
  };

  const plotSizeLabel = plotArea != null
    ? `${plotArea} Sq.Yd`
    : `${form.plotWidthFeet || '—'} × ${form.plotHeightFeet || '—'} ft`;

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={LAYOUT_LABELS.generateTownship}
      subtitle="Configure a premium DTCP/RERA-style township — plots, roads, and amenities are generated into this layout."
      size="lg"
      overlayMode="transparent"
      footer={
        <GenerateLayoutActionBar
          hasPreview={hasPreview}
          estimatedPlots={displaySummary?.plots ?? '—'}
          estimatedRevenue={formatRevenueShort(estimatedRevenue)}
          plotSizeLabel={plotSizeLabel}
          isGenerating={isGenerating}
          isSaving={isSaving}
          canGenerate={liveEstimate.valid}
          onGeneratePreview={onGeneratePreview}
          onSaveLayout={onSaveLayout}
          onExportExcel={onExportExcel}
          onRegenerate={onRegenerate}
          onReset={handleReset}
        />
      }
    >
      <div className="ui31-generate-layout">
        {!hasPreview && !isGenerating ? (
          <div className="ui31-gen-state ui31-gen-state--idle" role="status">
            Configure your layout and click Generate Preview.
          </div>
        ) : null}

        {hasPreview && !isGenerating ? (
          <div className="ui31-gen-state ui31-gen-state--success" role="status">
            Generation completed successfully. Ready to save.
            {generationTimeMs != null ? ` (${generationTimeMs} ms)` : ''}
          </div>
        ) : null}

        {isGenerating ? (
          <div className="plot-generate-drawer__progress ui31-gen-progress" role="status">
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

        {liveEstimate.valid && displaySummary ? (
          <GenerateLayoutSummary
            variant="sticky"
            summary={displaySummary}
            roadCounts={roadCounts}
            estimatedRevenue={estimatedRevenue}
          />
        ) : null}

        {inheritedRate > 0 ? (
          <div className="ui3-gen-inherit ui31-gen-inherit--compact">
            <div className="ui3-gen-inherit__copy">
              <span className="ui3-gen-inherit__label">Selling Rate</span>
              <strong>{formatSqYardPrice(inheritedRate)}</strong>
              <span className="ui3-gen-inherit__source">Inherited from Venture</span>
            </div>
            {!rateOverride ? (
              <button
                type="button"
                className="ui3-gen-inherit__override-btn"
                onClick={() => setRateOverride(true)}
              >
                Override
              </button>
            ) : (
              <div className="ui3-gen-inherit__override-field">
                <Input
                  label="Override rate / Sq.Yd (₹)"
                  type="number"
                  min={0}
                  step="any"
                  value={form.defaultRatePerSqYard}
                  onChange={(e) => setField('defaultRatePerSqYard', e.target.value)}
                />
                <button
                  type="button"
                  className="ui3-gen-inherit__override-btn"
                  onClick={() => {
                    setRateOverride(false);
                    setField(
                      'defaultRatePerSqYard',
                      inheritedRate ? String(inheritedRate) : ''
                    );
                  }}
                >
                  Use venture rate
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div className="ui31-gen-sections">
          <GenerateLayoutSection
            icon={FiGrid}
            tone="layout"
            compact
            title="Township Configuration"
            description="Size, density, and road style for realistic venture layouts."
          >
            <div className="ui3-gen-fields ui3-gen-fields--2 ui3-gen-fields--dense">
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Township Size</span>
                <select
                  className="ui3-gen-select"
                  value={form.townshipSize || 'medium'}
                  onChange={(e) => setField('townshipSize', e.target.value)}
                >
                  <option value="small">Small (~120 plots)</option>
                  <option value="medium">Medium (~450 plots)</option>
                  <option value="large">Large (~1200 plots)</option>
                </select>
              </label>
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Density</span>
                <select
                  className="ui3-gen-select"
                  value={form.density || 'medium'}
                  onChange={(e) => setField('density', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Road Style</span>
                <select
                  className="ui3-gen-select"
                  value={form.roadStyle || 'premium'}
                  onChange={(e) => setField('roadStyle', e.target.value)}
                >
                  <option value="grid">Grid</option>
                  <option value="organic">Organic</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Amenities Level</span>
                <select
                  className="ui3-gen-select"
                  value={form.amenitiesLevel || 'standard'}
                  onChange={(e) => setField('amenitiesLevel', e.target.value)}
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="luxury">Luxury</option>
                </select>
              </label>
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Road Width Preset</span>
                <select
                  className="ui3-gen-select"
                  value={form.roadWidthPreset || 'DTCP'}
                  onChange={(e) => setField('roadWidthPreset', e.target.value)}
                >
                  <option value="DTCP">DTCP</option>
                  <option value="HMDA">HMDA</option>
                  <option value="RERA">RERA</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Boundary Shape</span>
                <select
                  className="ui3-gen-select"
                  value={form.boundaryShape || 'auto'}
                  onChange={(e) => setField('boundaryShape', e.target.value)}
                >
                  <option value="auto">Auto</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="lShape">L Shape</option>
                  <option value="uShape">U Shape</option>
                  <option value="irregular">Irregular</option>
                </select>
              </label>
              <Input
                label="Commercial %"
                type="number"
                min={0}
                max={25}
                value={form.commercialPercent}
                onChange={(e) => setField('commercialPercent', e.target.value)}
                error={getError('commercialPercent')}
              />
              <Input
                label="Corner Plot %"
                type="number"
                min={0}
                max={30}
                value={form.cornerPlotPercent}
                onChange={(e) => setField('cornerPlotPercent', e.target.value)}
                error={getError('cornerPlotPercent')}
              />
              <Input
                label="Park %"
                type="number"
                min={5}
                max={25}
                value={form.parkPercent}
                onChange={(e) => setField('parkPercent', e.target.value)}
                error={getError('parkPercent')}
              />
              <Input
                label="Open Space %"
                type="number"
                min={5}
                max={30}
                value={form.openSpacePercent}
                onChange={(e) => setField('openSpacePercent', e.target.value)}
                error={getError('openSpacePercent')}
              />
              <Input
                label="Random Seed"
                type="number"
                placeholder="Leave empty for random"
                className="ui3-gen-fields__full"
                value={form.randomSeed}
                onChange={(e) => setField('randomSeed', e.target.value)}
              />
              <Input
                label="Block Prefix"
                required
                value={form.blockPrefix}
                onChange={(e) => setField('blockPrefix', e.target.value)}
                placeholder="A"
                error={getError('blockPrefix')}
              />
              <label className="ui3-gen-field">
                <span className="ui3-gen-field__label">Plot Numbering</span>
                <select
                  className="ui3-gen-select"
                  value={form.plotNumbering || 'block-wise'}
                  onChange={(e) => setField('plotNumbering', e.target.value)}
                >
                  <option value="block-wise">Block-wise</option>
                  <option value="row-wise">Row-wise</option>
                </select>
              </label>
            </div>
          </GenerateLayoutSection>

          <GenerateLayoutSection
            icon={FiHome}
            tone="plot"
            compact
            title="Plot Configuration"
            description="Starting plot number — sizes vary automatically (30×40 to 50×80)."
          >
            <div className="ui3-gen-fields ui3-gen-fields--2 ui3-gen-fields--dense">
              <Input
                label="Starting Plot Number"
                type="number"
                min={1}
                required
                className="ui3-gen-fields__full"
                value={form.startingPlotNumber}
                onChange={(e) => setField('startingPlotNumber', e.target.value)}
                error={getError('startingPlotNumber')}
              />
            </div>
            {displaySummary?.targetPlots ? (
              <div className="ui31-gen-area-card" aria-live="polite">
                <span className="ui31-gen-area-card__label">Estimated Plot Count</span>
                <strong className="ui31-gen-area-card__value">~{displaySummary.targetPlots} plots</strong>
                <span className="ui31-gen-area-card__hint">
                  {displaySummary.blocks} blocks · mixed sizes · {form.townshipSize} township
                </span>
              </div>
            ) : null}
          </GenerateLayoutSection>

          {form.roadWidthPreset === 'custom' ? (
          <GenerateLayoutSection
            icon={FiLayers}
            tone="road"
            compact
            title="Custom Road Widths"
            description="Override road hierarchy widths (feet)."
          >
            <div className="ui3-gen-fields ui3-gen-fields--2 ui3-gen-fields--dense">
              <Input
                label="Main Road Width (ft)"
                type="number"
                min={40}
                max={60}
                required
                value={form.mainRoadWidth}
                onChange={(e) => setField('mainRoadWidth', e.target.value)}
                error={getError('mainRoadWidth')}
              />
              <Input
                label="Internal Road Width (ft)"
                type="number"
                min={24}
                max={40}
                required
                value={form.internalRoadWidth}
                onChange={(e) => setField('internalRoadWidth', e.target.value)}
                error={getError('internalRoadWidth')}
              />
              <Input
                label="Secondary Road Width (ft)"
                type="number"
                min={18}
                max={30}
                value={form.secondaryRoadWidth}
                onChange={(e) => setField('secondaryRoadWidth', e.target.value)}
              />
              <Input
                label="Service Road Width (ft)"
                type="number"
                min={18}
                max={24}
                value={form.serviceRoadWidth}
                onChange={(e) => setField('serviceRoadWidth', e.target.value)}
              />
            </div>
          </GenerateLayoutSection>
          ) : null}

          <GenerateLayoutSection
            icon={FiSun}
            tone="amenities"
            compact
            title="Amenities"
            description="Select amenities — each is placed automatically in the layout."
          >
            <div className="ui31-gen-amenities" role="group" aria-label="Layout amenities">
              {AMENITY_ORDER.map((key) => {
                const meta = AMENITY_TYPES[key];
                const Icon = AMENITY_ICONS[key] || FiSun;
                const selected = Boolean(form.amenities?.[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`ui31-gen-amenity${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => setAmenity(key, !selected)}
                  >
                    <span className="ui31-gen-amenity__icon" aria-hidden>
                      <Icon />
                    </span>
                    <span className="ui31-gen-amenity__label">{meta?.label || key}</span>
                  </button>
                );
              })}
            </div>
          </GenerateLayoutSection>

          {layoutHealth ? (
            <LayoutHealthCard
              health={layoutHealth}
              onViewIssues={onViewHealthIssues}
              onHighlightIssue={onHighlightHealthIssue}
            />
          ) : null}

          <div className="ui3-gen-advanced">
            <button
              type="button"
              className="ui3-gen-advanced__toggle"
              onClick={() => setAdvancedOpen((openState) => !openState)}
              aria-expanded={advancedOpen}
            >
              <FiSettings aria-hidden />
              Advanced Settings
              {advancedOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {advancedOpen ? (
              <div className="ui3-gen-advanced__panel">
                <p className="ui3-gen-advanced__note">
                  <FiMapPin aria-hidden />
                  Map center coordinates for satellite placement.
                </p>
                <div className="ui3-gen-fields ui3-gen-fields--2 ui3-gen-fields--dense">
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
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </RightDrawer>
  );
}
