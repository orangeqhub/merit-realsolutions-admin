/** GIS Workbook import wizard — imports township data into an existing layout */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiFile,
  FiMap,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import Button from '../../components/ui/button/Button';
import ProgressBar from '../../components/feedback/ProgressBar';
import { LayoutExcelExporter, MAX_IMPORT_FILE_BYTES } from '../../services/layoutImport';
import { LAYOUT_LABELS, LAYOUT_MESSAGES } from '../../pages/layouts/layoutTerminology';
import ImportLayoutPreviewMap from './ImportLayoutPreviewMap';
import {
  WIZARD_STATE,
  canAdvanceToStep,
  cleanupWorkbookResources,
  commitWorkbookImport,
  createInitialWizardData,
  extractWorkbookMetadata,
  friendlyImportError,
  friendlyPreviewError,
  runWorkbookPipeline,
  wizardStateToStepIndex,
} from './workbookImportHelpers';
import './layout-import.css';

const STEPS = [
  { id: 'upload', label: 'Upload Workbook' },
  { id: 'validate', label: 'Validation' },
  { id: 'summary', label: 'Preview Summary' },
  { id: 'confirm', label: 'Confirm Import' },
  { id: 'success', label: 'Complete' },
];

const WORKBOOK_SHEETS = [
  { id: 'project', label: 'Project', required: true, scopes: ['project', 'workbook'] },
  { id: 'statistics', label: 'Statistics', required: false, scopes: ['statistics'] },
  { id: 'surveyReference', label: 'SurveyReference', required: false, scopes: ['surveyReference'] },
  { id: 'boundary', label: 'Boundary', required: true, scopes: ['boundary'] },
  { id: 'entrances', label: 'Entrances', required: false, scopes: ['entrances'] },
  { id: 'roads', label: 'Roads', required: false, scopes: ['road'] },
  { id: 'blocks', label: 'Blocks', required: false, scopes: ['blocks'] },
  { id: 'plotGeometry', label: 'PlotGeometry', required: true, scopes: ['plotGeometry'] },
  { id: 'amenities', label: 'Amenities', required: false, scopes: ['amenity'] },
  { id: 'utilities', label: 'Utilities', required: false, scopes: ['utilities'] },
  { id: 'landscaping', label: 'Landscaping', required: false, scopes: ['landscaping'] },
  { id: 'plotMaster', label: 'PlotMaster', required: true, scopes: ['plotMaster'] },
];

function sheetStatus(sheet, parsed, validation) {
  const presence = parsed?.sheetPresence || {};
  const counts = parsed?.counts || {};
  const scopeErrors = (validation?.errors || []).filter((e) => sheet.scopes.includes(e.scope));
  const scopeWarnings = (validation?.warnings || []).filter((e) => sheet.scopes.includes(e.scope));

  const isPresent = presence[sheet.id] ?? Boolean(parsed?.[sheet.id]?.length);

  if (sheet.id === 'project') {
    if (!isPresent) return { state: 'failed', detail: 'Missing required sheet: Project' };
    if (scopeErrors.length) return { state: 'failed', detail: `${scopeErrors.length} issue(s)` };
    const name = parsed?.projectRow?.ProjectName || parsed?.layoutRow?.LayoutName || 'Detected';
    const version = validation?.stats?.workbookFormatVersion || parsed?.workbookFormatVersion || '—';
    return { state: 'passed', detail: `${name} · v${version}` };
  }

  if (sheet.id === 'boundary') {
    if (!isPresent) return { state: 'failed', detail: 'Missing required sheet: Boundary' };
    if (scopeErrors.length) return { state: 'failed', detail: `${scopeErrors.length} error(s)` };
    return { state: 'passed', detail: `${counts.boundaryVertices || parsed?.boundary?.length || 0} vertex row(s)` };
  }

  if (sheet.id === 'plotGeometry') {
    if (!isPresent) return { state: 'failed', detail: 'Missing required sheet: PlotGeometry' };
    if (scopeErrors.length) return { state: 'failed', detail: `${scopeErrors.length} error(s)` };
    return {
      state: 'passed',
      detail: `${counts.plotGeometryGroups || validation?.stats?.plotGeometryGroups || 0} plot shape(s)`,
    };
  }

  if (sheet.id === 'plotMaster') {
    if (!isPresent) return { state: 'failed', detail: 'Missing required sheet: PlotMaster' };
    if (scopeErrors.length) return { state: 'failed', detail: `${scopeErrors.length} error(s)` };
    return { state: 'passed', detail: `${counts.plotMaster || validation?.stats?.plots || 0} inventory row(s)` };
  }

  if (!isPresent) {
    return sheet.required
      ? { state: 'failed', detail: `Missing required sheet: ${sheet.label}` }
      : { state: 'warning', detail: 'Optional — not present' };
  }

  if (scopeErrors.length) return { state: 'failed', detail: `${scopeErrors.length} error(s)` };

  if (sheet.id === 'roads') {
    const roadCount = counts.roads || validation?.stats?.roads || 0;
    if (!roadCount) return { state: 'warning', detail: 'No roads detected' };
    return { state: 'passed', detail: `${roadCount} road segment(s)` };
  }

  if (sheet.id === 'amenities') {
    const amenityCount = counts.amenities || validation?.stats?.amenities || 0;
    if (!amenityCount) return { state: 'warning', detail: 'No amenities' };
    return { state: 'passed', detail: `${amenityCount} amenity feature(s)` };
  }

  if (scopeWarnings.length) {
    return { state: 'warning', detail: scopeWarnings[0]?.message || 'Review warnings' };
  }

  return { state: 'passed', detail: 'Present' };
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function StatusIcon({ state }) {
  if (state === 'passed') return <FiCheckCircle className="layout-import-sheet__icon is-pass" aria-hidden />;
  if (state === 'failed') return <FiAlertCircle className="layout-import-sheet__icon is-fail" aria-hidden />;
  return <FiAlertTriangle className="layout-import-sheet__icon is-warn" aria-hidden />;
}

export default function ImportLayoutWizard({
  open,
  onClose,
  layout,
  venture,
  onImportComplete,
  onOpenWorkspace,
}) {
  const blobUrlsRef = useRef([]);
  const [wizardState, setWizardState] = useState(WIZARD_STATE.IDLE);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [workbookMetadata, setWorkbookMetadata] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [showMapPreview, setShowMapPreview] = useState(false);

  const stepIndex = wizardStateToStepIndex(wizardState);

  const reset = useCallback(() => {
    cleanupWorkbookResources({ blobUrls: blobUrlsRef.current });
    blobUrlsRef.current = [];
    const initial = createInitialWizardData();
    setWizardState(initial.wizardState);
    setUploadedFile(null);
    setUploadedFileName('');
    setUploadedFileSize(0);
    setWorkbookMetadata(null);
    setParsed(null);
    setValidation(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
    setBusy(false);
    setProgress(0);
    setProgressLabel('');
    setShowMapPreview(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose?.();
  }, [onClose, reset]);

  useEffect(() => () => {
    cleanupWorkbookResources({ blobUrls: blobUrlsRef.current });
  }, []);

  const goToStep = useCallback((targetStep) => {
    if (!canAdvanceToStep(targetStep, { wizardState, validation, preview })) return;
    if (targetStep === 0) {
      setWizardState(uploadedFile ? WIZARD_STATE.FILE_SELECTED : WIZARD_STATE.IDLE);
    } else if (targetStep === 1) {
      setWizardState(WIZARD_STATE.VALIDATED);
    } else if (targetStep === 2) {
      setWizardState(WIZARD_STATE.PREVIEW);
    } else if (targetStep === 3) {
      setWizardState(WIZARD_STATE.READY_TO_IMPORT);
    }
  }, [wizardState, validation, preview, uploadedFile]);

  const handleFile = useCallback(async (selected) => {
    if (!selected || busy) return;

    setError(null);
    setUploadedFile(selected);
    setUploadedFileName(selected.name);
    setUploadedFileSize(selected.size);
    setWizardState(WIZARD_STATE.FILE_SELECTED);
    setBusy(true);
    setProgressLabel('Reading workbook…');
    setProgress(8);

    try {
      const pipeline = await runWorkbookPipeline(selected, layout, {
        onProgress: (event) => {
          if (event.step === 'parse') setProgressLabel('Parsing sheets…');
          if (event.step === 'validate') setProgressLabel('Validating records…');
          setProgress((prev) => Math.min(95, event.percent || prev));
        },
      });

      setParsed(pipeline.parsed);
      setValidation(pipeline.validation);
      setPreview(pipeline.preview);
      setWorkbookMetadata(extractWorkbookMetadata(pipeline.parsed, selected));
      setProgress(100);
      setWizardState(WIZARD_STATE.VALIDATED);

      if (pipeline.validation?.valid && !pipeline.preview) {
        setError(friendlyPreviewError());
      }
    } catch (err) {
      setError(friendlyImportError(err));
      setWizardState(WIZARD_STATE.FILE_SELECTED);
      setParsed(null);
      setValidation(null);
      setPreview(null);
      setWorkbookMetadata(null);
    } finally {
      setBusy(false);
    }
  }, [layout, busy]);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const dropped = event.dataTransfer?.files?.[0];
      if (dropped) void handleFile(dropped);
    },
    [handleFile]
  );

  const canProceed = validation?.valid && preview;
  const canImport = canProceed && preview?.plots?.length;

  const stats = useMemo(
    () => ({
      project: workbookMetadata?.layoutName || parsed?.layoutRow?.LayoutName || layout?.name || '—',
      plots: preview?.plots?.length || workbookMetadata?.counts?.plots || parsed?.counts?.plots || 0,
      roads: preview?.roads?.length || workbookMetadata?.counts?.roads || parsed?.counts?.roads || 0,
      blocks: preview?.blockNames?.length || preview?.blockLabels?.length || 0,
      amenities: preview?.amenities?.length || workbookMetadata?.counts?.amenities || parsed?.counts?.amenities || 0,
      utilities: 0,
      landscaping: 0,
      errors: validation?.stats?.errorCount || 0,
      warnings: validation?.stats?.warningCount || 0,
    }),
    [workbookMetadata, parsed, preview, validation, layout?.name]
  );

  const sheetChecks = useMemo(
    () => WORKBOOK_SHEETS.map((sheet) => ({
      ...sheet,
      ...sheetStatus(sheet, parsed, validation),
    })),
    [parsed, validation]
  );

  const handleCommit = async () => {
    if (!canImport || busy) return;
    setBusy(true);
    setWizardState(WIZARD_STATE.IMPORTING);
    setError(null);
    setProgressLabel('Importing township data…');
    setProgress(20);

    try {
      const result = await commitWorkbookImport({ layout, venture, preview });
      setImportResult(result);
      setProgress(100);
      setWizardState(WIZARD_STATE.COMPLETED);
      onImportComplete?.({ preview, result });
    } catch (err) {
      setError(friendlyImportError(err));
      setWizardState(WIZARD_STATE.READY_TO_IMPORT);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="layout-import-wizard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={LAYOUT_LABELS.importGisWorkbook}
      >
        <div className="layout-import-wizard__backdrop" onClick={handleClose} />
        <motion.div
          className="layout-import-wizard__panel"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="layout-import-wizard__header">
            <div>
              <h2>{LAYOUT_LABELS.importGisWorkbook}</h2>
              <p>
                Import plots, roads, and amenities into <strong>{layout?.name}</strong> — the layout already exists; you are adding GIS township data.
              </p>
            </div>
            <button type="button" className="layout-import-wizard__close" onClick={handleClose} aria-label="Close">
              <FiX />
            </button>
          </header>

          <nav className="layout-import-wizard__steps" aria-label="Import steps">
            {STEPS.map((step, index) => (
              <span
                key={step.id}
                className={`layout-import-wizard__step${index === stepIndex ? ' is-active' : ''}${
                  index < stepIndex ? ' is-done' : ''
                }`}
              >
                {index + 1}. {step.label}
              </span>
            ))}
          </nav>

          {error ? (
            <div className="layout-import-wizard__error" role="alert">
              <FiAlertCircle /> {error}
            </div>
          ) : null}

          <div className="layout-import-wizard__body">
            {stepIndex === 0 && (
              <section className="layout-import-upload">
                <div
                  className="layout-import-upload__dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <FiUploadCloud aria-hidden />
                  <strong>Drop your GIS workbook here</strong>
                  <span>.xlsx · max {formatBytes(MAX_IMPORT_FILE_BYTES)}</span>
                  <label className="layout-import-upload__browse">
                    Browse files
                    <input
                      type="file"
                      accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      hidden
                      onChange={(e) => {
                        const next = e.target.files?.[0];
                        void handleFile(next);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="layout-import-upload__template">
                  <FiFile aria-hidden />
                  <div>
                    <strong>Need the template?</strong>
                    <p>
                      Download GIS Township Workbook V2.1. Polygon sheets (Boundary, Blocks,
                      PlotGeometry, Amenities) must explicitly close — Sequence N repeats Sequence 1.
                    </p>
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() =>
                      LayoutExcelExporter.downloadTemplate(
                        `${layout?.code || 'layout'}-gis-template.xlsx`
                      )
                    }
                  >
                    <FiDownload /> Template
                  </Button>
                </div>
                {uploadedFileName ? (
                  <p className="layout-import-upload__file">
                    Selected: <strong>{uploadedFileName}</strong> ({formatBytes(uploadedFileSize)})
                  </p>
                ) : null}
                {busy ? (
                  <div className="layout-import-wizard__progress">
                    <ProgressBar value={progress} max={100} />
                    <span>{progressLabel}</span>
                  </div>
                ) : null}
              </section>
            )}

            {stepIndex === 1 && validation && (
              <section className="layout-import-validate">
                <div className="layout-import-validate__result">
                  {validation.valid ? (
                    <p className="layout-import-validate__ok">
                      <FiCheckCircle /> Workbook validation passed — ready for preview.
                    </p>
                  ) : (
                    <p className="layout-import-validate__fail">
                      <FiAlertCircle /> Workbook validation failed — fix errors before importing.
                    </p>
                  )}
                </div>

                <ul className="layout-import-sheet-list" aria-label="Workbook sheets">
                  {sheetChecks.map((sheet) => (
                    <li
                      key={sheet.id}
                      className={`layout-import-sheet is-${sheet.state === 'passed' ? 'passed' : sheet.state === 'failed' ? 'failed' : 'warning'}`}
                    >
                      <StatusIcon state={sheet.state} />
                      <div className="layout-import-sheet__body">
                        <strong>{sheet.label}</strong>
                        <span>{sheet.detail}</span>
                      </div>
                      <span className="layout-import-sheet__badge">
                        {sheet.state === 'passed' ? 'Passed' : sheet.state === 'failed' ? 'Failed' : 'Warning'}
                      </span>
                    </li>
                  ))}
                </ul>

                {!validation.valid ? (
                  <div className="layout-import-validate__list">
                    {[...validation.errors].slice(0, 40).map((item, index) => (
                      <p key={`${item.scope}-${item.row}-${index}`}>
                        [{item.scope}{item.row ? ` row ${item.row}` : ''}] {item.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </section>
            )}

            {stepIndex === 2 && preview && (
              <section className="layout-import-summary">
                <div className="layout-import-summary__grid">
                  <div><span>Project</span><strong>{stats.project}</strong></div>
                  <div><span>Plots</span><strong>{stats.plots}</strong></div>
                  <div><span>Roads</span><strong>{stats.roads}</strong></div>
                  <div><span>Blocks</span><strong>{stats.blocks || '—'}</strong></div>
                  <div><span>Amenities</span><strong>{stats.amenities}</strong></div>
                  <div><span>Utilities</span><strong>{stats.utilities || '—'}</strong></div>
                  <div><span>Landscaping</span><strong>{stats.landscaping || '—'}</strong></div>
                </div>

                <div className="layout-import-summary__map-toggle">
                  <Button variant="ghost" size="sm" onClick={() => setShowMapPreview((v) => !v)}>
                    <FiMap /> {showMapPreview ? 'Hide Map Preview' : 'Show Map Preview'}
                  </Button>
                </div>

                {showMapPreview ? (
                  <ImportLayoutPreviewMap preview={preview} layout={layout} venture={venture} />
                ) : null}
              </section>
            )}

            {stepIndex === 3 && (
              <section className="layout-import-confirm">
                <p className="layout-import-confirm__lead">
                  Import <strong>{stats.plots} plots</strong>, <strong>{stats.roads} roads</strong>, and{' '}
                  <strong>{stats.amenities} amenities</strong> into <strong>{layout?.name}</strong>?
                </p>
                <p className="layout-import-confirm__note">
                  Existing GIS layers for this layout may be replaced. Layout metadata is not changed.
                </p>
                {busy ? (
                  <div className="layout-import-wizard__progress">
                    <ProgressBar value={progress} max={100} />
                    <span>{progressLabel}</span>
                  </div>
                ) : null}
              </section>
            )}

            {stepIndex === 4 && importResult && (
              <section className="layout-import-result">
                <motion.div
                  className="layout-import-result__success"
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <FiCheckCircle aria-hidden />
                  <h3>{LAYOUT_MESSAGES.importSuccess}</h3>
                  <p>
                    {stats.plots} plots, {stats.roads} roads, and {stats.amenities} amenities are ready in the workspace.
                  </p>
                </motion.div>
              </section>
            )}
          </div>

          <footer className="layout-import-wizard__footer">
            {stepIndex === 0 && (
              <Button variant="ghost" onClick={handleClose} disabled={busy}>
                Cancel
              </Button>
            )}
            {stepIndex === 1 && (
              <>
                <Button variant="ghost" onClick={() => goToStep(0)} disabled={busy}>
                  Back
                </Button>
                <Button variant="accent" onClick={() => goToStep(2)} disabled={!canProceed || busy}>
                  Continue
                </Button>
              </>
            )}
            {stepIndex === 2 && (
              <>
                <Button variant="ghost" onClick={() => goToStep(1)} disabled={busy}>
                  Back
                </Button>
                <Button variant="accent" onClick={() => goToStep(3)} disabled={!canImport || busy}>
                  Continue
                </Button>
              </>
            )}
            {stepIndex === 3 && (
              <>
                <Button variant="ghost" onClick={() => goToStep(2)} disabled={busy}>
                  Back
                </Button>
                <Button variant="ghost" onClick={handleClose} disabled={busy}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={handleCommit} disabled={!canImport || busy}>
                  Import
                </Button>
              </>
            )}
            {stepIndex === 4 && importResult && (
              <>
                <Button variant="ghost" onClick={handleClose}>
                  Return to Dashboard
                </Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    handleClose();
                    onOpenWorkspace?.();
                  }}
                >
                  Open Workspace
                </Button>
              </>
            )}
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
