import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowRight,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiFileText,
  FiDownloadCloud,
  FiList,
  FiMap,
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Select from "../../components/ui/select/Select";
import Stepper from "../../components/forms/Stepper";
import DataTable from "../../components/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { usePlots } from "../../context/PlotsContext";
import { useLayouts } from "../../shared/hooks/useLayouts.js";
import { useVentures } from "../../context/VenturesContext";
import { useToast } from "../../components/feedback/Toast";
import {
  ExcelParserService,
  PlotValidationService,
  PlotImportService,
  IMPORT_WIZARD_STEPS,
} from "../../services/plotImport";
import ImportMapPreview from "./ImportMapPreview";
import PlotStatusBadge from "../../components/plots/PlotStatusBadge";
import { formatINR } from "./constants";
import "./plotInventory.css";
import "./ImportMapPreview.css";

export default function PlotBulkImport() {
  const toast = useToast();
  const { plots } = usePlots();
  const { layouts } = useLayouts();
  const { getVenture } = useVentures();

  const [step, setStep] = useState(0);
  const [targetLayoutId, setTargetLayoutId] = useState(layouts[0]?.id || "");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const layoutOptions = layouts.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.ventureName})`,
  }));

  const selectedLayout = useMemo(
    () => layouts.find((l) => l.id === targetLayoutId) || null,
    [layouts, targetLayoutId]
  );

  const selectedVenture = useMemo(
    () => (selectedLayout ? getVenture(selectedLayout.ventureId) : null),
    [getVenture, selectedLayout]
  );

  const previewPlots = useMemo(
    () => (validation?.validRows || []).map((row) => PlotValidationService.toPreviewPlot(row)),
    [validation]
  );

  const runValidation = (rows) => {
    const report = PlotValidationService.validateRows(rows, {
      layoutId: targetLayoutId,
      existingPlots: plots,
    });
    setValidation(report);
    return report;
  };

  const handleDownloadTemplate = () => {
    if (!targetLayoutId) {
      toast.error("Select a layout before downloading the template");
      return;
    }
    ExcelParserService.downloadTemplate(
      `plot-import-${selectedLayout?.name?.replace(/\s+/g, "-").toLowerCase() || "template"}.xlsx`
    );
    toast.success("Template downloaded");
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!targetLayoutId) {
      toast.error("Select a target layout first");
      return;
    }

    try {
      const parsed = await ExcelParserService.parseFile(file);
      setFileName(parsed.fileName);
      setParsedRows(parsed.rows);
      setValidation(null);
      setImportSummary(null);
      toast.success(`${parsed.totalRows} rows loaded from ${parsed.fileName}`);
    } catch (error) {
      toast.error(error.message || "Unable to parse file");
    }
  };

  const next = () => {
    if (step === 0 && !targetLayoutId) {
      toast.error("Select the layout you are importing into");
      return;
    }
    if (step === 1 && !parsedRows.length) {
      toast.error("Upload an Excel file first");
      return;
    }
    if (step === 1) {
      const report = runValidation(parsedRows);
      if (!report.validRows.length && report.invalidRows.length) {
        toast.warning("All rows failed validation — review errors before continuing");
      }
    }
    if (step === 2 && !validation?.validRows.length) {
      toast.error("Fix validation errors or upload a valid file before preview");
      return;
    }
    setStep((current) => Math.min(current + 1, IMPORT_WIZARD_STEPS.length - 1));
  };

  const prev = () => setStep((current) => Math.max(current - 1, 0));

  const handleDownloadErrors = () => {
    if (!validation?.invalidRows?.length) return;
    ExcelParserService.downloadErrorReport(validation.invalidRows);
    toast.info("Error report downloaded");
  };

  const handleImport = async () => {
    if (!validation?.validRows?.length) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const result = await PlotImportService.importPlots(validation.validRows, {
        layoutId: targetLayoutId,
        layout: selectedLayout,
      });
      setImportSummary({
        ...result.summary,
        skipped: validation?.summary?.invalid ?? 0,
        duplicates:
          result.summary?.duplicates ?? validation?.summary?.duplicates ?? 0,
      });
      setStep(4);
      toast.success(`${result.summary.imported} plots imported successfully`);
    } catch (error) {
      toast.error(error.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const previewColumns = [
    {
      key: "plotNumber",
      header: "Plot No.",
      render: (row) => row.plotNumber,
    },
    {
      key: "areaSqYards",
      header: "Area",
      align: "right",
      render: (row) => `${row.areaSqYards} sq.yd`,
    },
    {
      key: "ratePerSqYard",
      header: "Rate",
      align: "right",
      render: (row) => formatINR(row.ratePerSqYard),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <PlotStatusBadge status={row.status} size="sm" />,
    },
    {
      key: "facing",
      header: "Facing",
    },
  ];

  const validationColumns = [
    { key: "rowNumber", header: "Row", render: (row) => row.rowNumber },
    { key: "plotNumber", header: "Plot No.", render: (row) => row.plotNumber || "—" },
    {
      key: "errors",
      header: "Errors",
      render: (row) =>
        row.valid ? (
          <Badge tone="success" size="sm"><FiCheckCircle /> Valid</Badge>
        ) : (
          <span className="plot-import__error-text">{row.errors.join(" ")}</span>
        ),
    },
  ];

  return (
    <motion.div className="plot-page plot-import-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Bulk Plot Import"
        description="Import plots from Excel with coordinate validation, map preview, and batch save."
        actions={
          <Button variant="ghost" size="md" to="/dashboard/plots/list">
            <FiList /> Inventory
          </Button>
        }
      />

      <div className="plot-import__stepper">
        <Stepper steps={IMPORT_WIZARD_STEPS} current={step} />
      </div>

      <div className="plot-import__panel">
        {step === 0 && (
          <div>
            <Select
              label="Import into Layout"
              value={targetLayoutId}
              onChange={setTargetLayoutId}
              options={layoutOptions}
              searchable
              className="plot-import__layout-select"
            />
            <div className="plot-import__instructions">
              <p>Download the Excel template, fill one row per plot, then upload it in the next step.</p>
              <ul>
                <li>Plot Number must be unique within the layout.</li>
                <li>Area, Price (Rate per sq.yd), and Status are required.</li>
                <li>All four corner latitude/longitude pairs are required (decimal degrees).</li>
                <li>Status: AVAILABLE, RESERVED, BOOKED, SOLD, or BLOCKED.</li>
              </ul>
            </div>
            <div className="plot-import__template-actions">
              <Button variant="accent" size="md" onClick={handleDownloadTemplate}>
                <FiDownloadCloud /> Download Excel Template
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="plot-import__upload">
            <Select
              label="Target Layout"
              value={targetLayoutId}
              onChange={setTargetLayoutId}
              options={layoutOptions}
              searchable
              className="plot-import__layout-select"
            />
            <label className="plot-import__dropzone">
              <span className="plot-import__icon"><FiUploadCloud /></span>
              <strong>Click to upload Excel file</strong>
              <span>or drag &amp; drop .xlsx / .xls</span>
              <small>Max recommended: 500 rows per import</small>
              <input type="file" accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile} hidden />
            </label>
            {fileName && (
              <p className="plot-import__file">
                <FiFileText /> {fileName} · {parsedRows.length} rows detected
              </p>
            )}
          </div>
        )}

        {step === 2 && validation && (
          <div>
            <div className="plot-import__validation">
              <Badge tone="success"><FiCheckCircle /> {validation.summary.valid} valid</Badge>
              <Badge tone="danger"><FiAlertTriangle /> {validation.summary.invalid} invalid</Badge>
              {validation.summary.duplicates > 0 && (
                <Badge tone="warning"><FiAlertTriangle /> {validation.summary.duplicates} duplicate conflicts</Badge>
              )}
            </div>
            {validation.invalidRows.length > 0 && (
              <div className="plot-import__template-actions" style={{ marginBottom: "1rem" }}>
                <Button variant="soft" size="md" onClick={handleDownloadErrors}>
                  <FiDownloadCloud /> Download Error Report
                </Button>
              </div>
            )}
            <DataTable
              className="plot-import__errors-table"
              columns={validationColumns}
              data={validation.results}
              rowKey={(row) => `row-${row.rowNumber}`}
              paginated
              pageSize={10}
            />
          </div>
        )}

        {step === 3 && validation && (
          <div className="plot-import__preview-layout">
            <div>
              <div className="plot-import__validation">
                <Badge tone="info"><FiMap /> {previewPlots.length} polygons on map (preview only)</Badge>
              </div>
              <DataTable
                columns={previewColumns}
                data={validation.validRows}
                rowKey={(row) => `preview-${row.rowNumber}`}
                paginated
                pageSize={8}
              />
            </div>
            <ImportMapPreview
              layout={selectedLayout}
              venture={selectedVenture}
              previewPlots={previewPlots}
            />
          </div>
        )}

        {step === 4 && importSummary && (
          <div className="plot-import__done">
            <span className="plot-import__done-icon"><FiCheckCircle /></span>
            <h2>Import Complete</h2>
            <p>Plots were saved for layout <strong>{selectedLayout?.name}</strong>.</p>
            <div className="plot-import__summary-grid">
              <div className="plot-import__summary-card">
                <strong>{importSummary.imported}</strong>
                <span>Imported</span>
              </div>
              <div className="plot-import__summary-card">
                <strong>{importSummary.failed ?? 0}</strong>
                <span>Failed</span>
              </div>
              <div className="plot-import__summary-card">
                <strong>{importSummary.duplicates ?? validation?.summary?.duplicates ?? 0}</strong>
                <span>Duplicates skipped</span>
              </div>
              <div className="plot-import__summary-card">
                <strong>{validation?.summary?.invalid ?? 0}</strong>
                <span>Invalid rows skipped</span>
              </div>
            </div>
            <div className="plot-import__done-actions">
              <Button variant="accent" size="md" to="/dashboard/plots/list">
                <FiList /> View Inventory
              </Button>
              {selectedLayout && (
                <Button
                  variant="ghost"
                  size="md"
                  to={`/dashboard/layouts/${selectedLayout.id}/workspace`}
                >
                  <FiMap /> Open Layout Workspace
                </Button>
              )}
              <Button variant="ghost" size="md" to="/dashboard/plots">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {step < 4 && (
          <footer className="plot-import__footer">
            <Button variant="ghost" size="md" onClick={prev} disabled={step === 0}>
              <FiArrowLeft /> Back
            </Button>
            {step < 3 ? (
              <Button variant="accent" size="md" onClick={next}>
                Next <FiArrowRight />
              </Button>
            ) : (
              <Button variant="accent" size="md" onClick={handleImport} disabled={importing || !validation?.validRows?.length}>
                {importing ? "Importing…" : `Import ${validation?.validRows?.length || 0} Plots`}
              </Button>
            )}
          </footer>
        )}
      </div>
    </motion.div>
  );
}
