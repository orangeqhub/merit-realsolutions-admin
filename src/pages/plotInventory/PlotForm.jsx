import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiSave } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import Textarea from "../../components/ui/textarea/Textarea";
import Select from "../../components/ui/select/Select";
import Switch from "../../components/ui/switch/Switch";
import FormSection from "../../components/forms/FormSection";
import Stepper from "../../components/forms/Stepper";
import SummaryCard from "../../components/cards/SummaryCard";
import { usePlots } from "../../context/PlotsContext";
import { useVentures } from "../../shared/hooks/useVentures.js";
import { useLayouts } from "../../shared/hooks/useLayouts.js";
import { useToast } from "../../components/feedback/Toast";
import {
  FACINGS,
  ROAD_WIDTHS,
  PLOT_STATUSES,
  WIZARD_STEPS,
  EMPTY_PLOT,
  derivePricing,
  formatINR,
} from "./constants";
import "./plotInventory.css";

export default function PlotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { getPlot, addPlot, updatePlot } = usePlots();
  const { ventures } = useVentures();
  const { layouts } = useLayouts();
  const editing = id ? getPlot(id) : null;

  const ventureOptions = useMemo(
    () => ventures.map((v) => ({ value: v.id, label: v.name })),
    [ventures]
  );

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => {
    if (editing) return { ...EMPTY_PLOT, ...editing };
    const preLayoutId = searchParams.get("layout");
    const preLayout = layouts.find((l) => l.id === preLayoutId);
    return {
      ...EMPTY_PLOT,
      ventureId: preLayout?.ventureId || "",
      ventureName: preLayout?.ventureName || "",
      layoutId: preLayout?.id || "",
      layoutName: preLayout?.name || "",
      ratePerSqYard: preLayout?.currentPrice || "",
    };
  });

  const layoutOptions = useMemo(
    () =>
      layouts
        .filter((l) => !form.ventureId || l.ventureId === form.ventureId)
        .map((l) => ({ value: l.id, label: l.name })),
    [form.ventureId, layouts]
  );

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const setVenture = (ventureId) => {
    const v = ventures.find((x) => x.id === ventureId);
    setForm((p) => ({ ...p, ventureId, ventureName: v?.name || "", layoutId: "", layoutName: "" }));
    setErrors((p) => ({ ...p, ventureId: undefined }));
  };

  const setLayout = (layoutId) => {
    const l = layouts.find((x) => x.id === layoutId);
    setForm((p) => ({
      ...p,
      layoutId,
      layoutName: l?.name || "",
      ratePerSqYard: p.ratePerSqYard || l?.currentPrice || "",
    }));
    setErrors((p) => ({ ...p, layoutId: undefined }));
  };

  const validateStep = (target) => {
    const e = {};
    if (target === 0) {
      if (!form.plotNumber?.trim()) e.plotNumber = "Plot number is required";
      if (!form.ventureId) e.ventureId = "Select a venture";
      if (!form.layoutId) e.layoutId = "Select a layout";
    }
    if (target === 1) {
      if (form.areaSqYards && Number(form.areaSqYards) <= 0) e.areaSqYards = "Enter a valid area";
    }
    return e;
  };

  const handleNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const save = () => {
    const e = validateStep(0);
    if (Object.keys(e).length) {
      setErrors(e);
      setStep(0);
      toast.error("Please complete the required fields");
      return;
    }
    if (editing) {
      updatePlot(editing.id, form);
      toast.success("Plot updated successfully");
      navigate(`/dashboard/plots/${editing.id}`);
    } else {
      const record = addPlot(form);
      toast.success("Plot created successfully");
      navigate(`/dashboard/plots/${record.id}`);
    }
  };

  const pricing = derivePricing(form);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <FormSection title="Property Details" columns={2}>
            <Input label="Plot Number" required value={form.plotNumber} onChange={(e) => setField("plotNumber", e.target.value)} placeholder="A-112" error={errors.plotNumber} />
            <Input label="Block" value={form.block} onChange={(e) => setField("block", e.target.value)} placeholder="A" />
            <Select label="Venture" required value={form.ventureId} onChange={setVenture} options={ventureOptions} placeholder="Select venture" searchable error={errors.ventureId} />
            <Select label="Layout" required value={form.layoutId} onChange={setLayout} options={layoutOptions} placeholder="Select layout" searchable error={errors.layoutId} />
            <Select label="Facing" value={form.facing} onChange={(v) => setField("facing", v)} options={FACINGS} />
            <Select label="Road Width" value={form.roadWidth} onChange={(v) => setField("roadWidth", v)} options={ROAD_WIDTHS} />
            <div className="form-section__full">
              <Switch label="Corner Plot" checked={form.corner} onChange={(v) => setField("corner", v)} />
            </div>
          </FormSection>
        );
      case 1:
        return (
          <FormSection title="Dimensions" columns={2}>
            <Input label="Dimensions" value={form.dimensions} onChange={(e) => setField("dimensions", e.target.value)} placeholder="40x60" />
            <Input label="Area (sq.yd)" type="number" value={form.areaSqYards} onChange={(e) => setField("areaSqYards", e.target.value)} error={errors.areaSqYards} />
          </FormSection>
        );
      case 2:
        return (
          <FormSection title="Pricing" columns={2}>
            <Input label="Rate per sq.yd" type="number" value={form.ratePerSqYard} onChange={(e) => setField("ratePerSqYard", e.target.value)} />
            <Input label="Development Charges" type="number" value={form.developmentCharges} onChange={(e) => setField("developmentCharges", e.target.value)} />
            <Input label="Registration Charges" type="number" value={form.registrationCharges} onChange={(e) => setField("registrationCharges", e.target.value)} />
            <Input label="Discount (%)" type="number" value={form.discountPct} onChange={(e) => setField("discountPct", e.target.value)} />
            <div className="form-section__full plot-form__preview">
              <span>Estimated Final Price</span>
              <strong>{formatINR(pricing.finalPrice)}</strong>
            </div>
          </FormSection>
        );
      case 3:
        return (
          <FormSection title="Status & Assignment" columns={2}>
            <Select label="Status" value={form.status} onChange={(v) => setField("status", v)} options={PLOT_STATUSES} />
            <Input label="Customer" value={form.customer} onChange={(e) => setField("customer", e.target.value)} placeholder="Customer name" />
            <Input label="Sales Agent" value={form.agent} onChange={(e) => setField("agent", e.target.value)} />
            <Input label="Executive" value={form.executive} onChange={(e) => setField("executive", e.target.value)} />
            <Input label="CRM Owner" value={form.crmOwner} onChange={(e) => setField("crmOwner", e.target.value)} />
            <Input label="Reservation Expiry" type="date" value={form.reservationExpiry} onChange={(e) => setField("reservationExpiry", e.target.value)} />
            <Textarea label="Notes" value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} className="form-section__full" />
            <div className="form-section__full plot-form__summary">
              <SummaryCard label="Plot" value={form.plotNumber || "—"} tone="accent" />
              <SummaryCard label="Layout" value={form.layoutName || "—"} tone="info" />
              <SummaryCard label="Area" value={form.areaSqYards ? `${form.areaSqYards} sq.yd` : "—"} tone="primary" />
              <SummaryCard label="Final Price" value={formatINR(pricing.finalPrice)} tone="success" />
            </div>
          </FormSection>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="plot-page plot-form-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title={editing ? "Edit Plot" : "Add Plot"}
        description={`Step ${step + 1} of ${WIZARD_STEPS.length} — ${WIZARD_STEPS[step].label}`}
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Cancel
          </Button>
        }
      />

      <div className="plot-wizard">
        <aside className="plot-wizard__steps">
          <Stepper steps={WIZARD_STEPS} current={step} onStepClick={(i) => i <= step && setStep(i)} orientation="vertical" />
        </aside>

        <div className="plot-wizard__content">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            {renderStep()}
          </motion.div>

          <footer className="plot-wizard__footer">
            <Button variant="ghost" size="md" onClick={handlePrev} disabled={step === 0}>
              <FiArrowLeft /> Previous
            </Button>
            <div className="plot-wizard__footer-right">
              {step < WIZARD_STEPS.length - 1 ? (
                <Button variant="accent" size="md" onClick={handleNext}>
                  Next <FiArrowRight />
                </Button>
              ) : (
                <Button variant="accent" size="md" onClick={save}>
                  <FiSave /> {editing ? "Save Changes" : "Create Plot"}
                </Button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
