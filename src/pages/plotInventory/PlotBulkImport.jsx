import { useState } from "react";
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
} from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Select from "../../components/ui/select/Select";
import Stepper from "../../components/forms/Stepper";
import DataTable from "../../components/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { usePlots } from "../../context/PlotsContext";
import { useLayouts } from "../../shared/hooks/useLayouts.js";
import { useToast } from "../../components/feedback/Toast";
import { formatINR } from "./constants";
import "./plotInventory.css";

const STEPS = [
  { label: "Upload", description: "Excel / CSV" },
  { label: "Map Columns", description: "Match fields" },
  { label: "Preview", description: "Validate rows" },
  { label: "Done", description: "Summary" },
];

const TARGET_FIELDS = [
  { value: "plotNumber", label: "Plot Number" },
  { value: "dimensions", label: "Dimensions" },
  { value: "areaSqYards", label: "Area (sq.yd)" },
  { value: "facing", label: "Facing" },
  { value: "ratePerSqYard", label: "Rate / sq.yd" },
  { value: "status", label: "Status" },
  { value: "ignore", label: "— Ignore —" },
];

const SAMPLE = [
  { plot_no: "S-101", size: "30x40", area: 133, face: "East", rate: 12500, state: "Available" },
  { plot_no: "S-102", size: "30x50", area: 167, face: "West", rate: 12500, state: "Available" },
  { plot_no: "S-103", size: "40x60", area: 267, face: "North", rate: 12800, state: "Reserved" },
  { plot_no: "S-104", size: "40x60", area: 267, face: "South", rate: 12800, state: "Available" },
  { plot_no: "S-105", size: "50x80", area: 444, face: "East", rate: 13500, state: "Booked" },
  { plot_no: "", size: "30x40", area: 133, face: "East", rate: 12500, state: "Available" },
  { plot_no: "S-107", size: "30x40", area: 0, face: "West", rate: 12500, state: "Available" },
  { plot_no: "S-108", size: "60x90", area: 600, face: "North-East", rate: 14000, state: "Available" },
];

const SOURCE_COLUMNS = ["plot_no", "size", "area", "face", "rate", "state"];
const DEFAULT_MAP = {
  plot_no: "plotNumber",
  size: "dimensions",
  area: "areaSqYards",
  face: "facing",
  rate: "ratePerSqYard",
  state: "status",
};

export default function PlotBulkImport() {
  const toast = useToast();
  const { addPlot } = usePlots();
  const { layouts } = useLayouts();

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState(DEFAULT_MAP);
  const [targetLayoutId, setTargetLayoutId] = useState(layouts[0]?.id || "");
  const [importedCount, setImportedCount] = useState(0);

  const layoutOptions = layouts.map((l) => ({ value: l.id, label: `${l.name} (${l.ventureName})` }));

  const loadSample = () => {
    setFileName("sample-plots.csv");
    setRows(SAMPLE);
    toast.info("Sample file loaded");
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setRows(SAMPLE);
    toast.info(`${file.name} parsed (${SAMPLE.length} rows)`);
  };

  const mapped = rows.map((r) => {
    const obj = {};
    Object.entries(mapping).forEach(([src, target]) => {
      if (target && target !== "ignore") obj[target] = r[src];
    });
    const valid = Boolean(obj.plotNumber) && Number(obj.areaSqYards) > 0;
    return { ...obj, __valid: valid };
  });

  const validRows = mapped.filter((r) => r.__valid);
  const invalidRows = mapped.filter((r) => !r.__valid);

  const next = () => {
    if (step === 0 && !rows.length) {
      toast.error("Upload a file or load the sample first");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const runImport = () => {
    const layout = layouts.find((l) => l.id === targetLayoutId);
    validRows.forEach((r) => {
      addPlot({
        plotNumber: r.plotNumber,
        dimensions: r.dimensions,
        areaSqYards: Number(r.areaSqYards),
        facing: r.facing,
        ratePerSqYard: Number(r.ratePerSqYard),
        status: r.status || "Available",
        ventureId: layout?.ventureId || "",
        ventureName: layout?.ventureName || "",
        layoutId: layout?.id || "",
        layoutName: layout?.name || "",
      });
    });
    setImportedCount(validRows.length);
    setStep(3);
    toast.success(`${validRows.length} plots imported`);
  };

  const previewColumns = [
    { key: "plotNumber", header: "Plot No.", render: (r) => r.plotNumber || <span className="plot-table__dash">missing</span> },
    { key: "dimensions", header: "Dimensions" },
    { key: "areaSqYards", header: "Area", align: "right", render: (r) => (Number(r.areaSqYards) > 0 ? `${r.areaSqYards} sq.yd` : <span className="plot-table__dash">invalid</span>) },
    { key: "facing", header: "Facing" },
    { key: "ratePerSqYard", header: "Rate", align: "right", render: (r) => formatINR(r.ratePerSqYard) },
    { key: "status", header: "Status" },
    {
      key: "__valid",
      header: "Validation",
      render: (r) =>
        r.__valid ? (
          <Badge tone="success" size="sm"><FiCheckCircle /> Valid</Badge>
        ) : (
          <Badge tone="danger" size="sm"><FiAlertTriangle /> Invalid</Badge>
        ),
    },
  ];

  return (
    <motion.div className="plot-page plot-import-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Bulk Plot Import"
        description="Import plots in bulk from Excel or CSV with preview, column mapping and validation."
        actions={
          <Button variant="ghost" size="md" to="/dashboard/plots/list">
            <FiList /> Inventory
          </Button>
        }
      />

      <div className="plot-import__stepper">
        <Stepper steps={STEPS} current={step} />
      </div>

      <div className="plot-import__panel">
        {step === 0 && (
          <div className="plot-import__upload">
            <label className="plot-import__dropzone">
              <span className="plot-import__icon"><FiUploadCloud /></span>
              <strong>Click to upload</strong>
              <span>or drag &amp; drop your Excel / CSV file</span>
              <small>Supported: .xlsx, .csv — up to 5MB</small>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} hidden />
            </label>
            <div className="plot-import__or">or</div>
            <Button variant="soft" size="md" onClick={loadSample}>
              <FiDownloadCloud /> Load Sample Data
            </Button>
            {fileName && (
              <p className="plot-import__file">
                <FiFileText /> {fileName} · {rows.length} rows detected
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="plot-import__mapping">
            <p className="plot-import__hint">Match each column from your file to a plot field.</p>
            <div className="plot-import__map-grid">
              {SOURCE_COLUMNS.map((src) => (
                <div key={src} className="plot-import__map-row">
                  <span className="plot-import__map-source">{src}</span>
                  <FiArrowRight />
                  <Select
                    value={mapping[src] || "ignore"}
                    onChange={(v) => setMapping((m) => ({ ...m, [src]: v }))}
                    options={TARGET_FIELDS}
                  />
                </div>
              ))}
            </div>
            <div className="plot-import__target">
              <Select
                label="Import into Layout"
                value={targetLayoutId}
                onChange={setTargetLayoutId}
                options={layoutOptions}
                searchable
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="plot-import__preview">
            <div className="plot-import__validation">
              <Badge tone="success"><FiCheckCircle /> {validRows.length} valid</Badge>
              <Badge tone="danger"><FiAlertTriangle /> {invalidRows.length} invalid</Badge>
            </div>
            <DataTable columns={previewColumns} data={mapped} rowKey={(r) => r.plotNumber || Math.random()} paginated={false} />
          </div>
        )}

        {step === 3 && (
          <div className="plot-import__done">
            <span className="plot-import__done-icon"><FiCheckCircle /></span>
            <h2>Import Complete</h2>
            <p>{importedCount} plots were successfully imported into the inventory.</p>
            {invalidRows.length > 0 && (
              <p className="plot-import__done-warn">
                {invalidRows.length} rows were skipped due to validation errors.
              </p>
            )}
            <div className="plot-import__done-actions">
              <Button variant="accent" size="md" to="/dashboard/plots/list">
                <FiList /> View Inventory
              </Button>
              <Button variant="ghost" size="md" to="/dashboard/plots">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {step < 3 && (
          <footer className="plot-import__footer">
            <Button variant="ghost" size="md" onClick={prev} disabled={step === 0}>
              <FiArrowLeft /> Back
            </Button>
            {step < 2 ? (
              <Button variant="accent" size="md" onClick={next}>
                Next <FiArrowRight />
              </Button>
            ) : (
              <Button variant="accent" size="md" onClick={runImport} disabled={!validRows.length}>
                Import {validRows.length} Plots
              </Button>
            )}
          </footer>
        )}
      </div>
    </motion.div>
  );
}
