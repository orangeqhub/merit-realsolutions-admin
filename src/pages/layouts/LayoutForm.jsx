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
import Upload from "../../components/ui/upload/Upload";
import FormSection from "../../components/forms/FormSection";
import Stepper from "../../components/forms/Stepper";
import SummaryCard from "../../components/cards/SummaryCard";
import { useLayouts } from "../../context/LayoutsContext";
import { useVentures } from "../../shared/hooks/useVentures.js";
import { useToast } from "../../components/feedback/Toast";
import {
  APPROVAL_TYPES,
  STATES,
  LAYOUT_STATUS,
  LAYOUT_AMENITY_KEYS,
  WIZARD_STEPS,
  EMPTY_LAYOUT,
  formatArea,
  formatSqYardPrice,
} from "./constants";
import "./layout.css";

export default function LayoutForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { getLayout, addLayout, updateLayout } = useLayouts();
  const { ventures } = useVentures();
  const editing = id ? getLayout(id) : null;

  const ventureOptions = useMemo(
    () => ventures.map((v) => ({ value: v.id, label: v.name })),
    [ventures]
  );

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => {
    if (editing) return { ...EMPTY_LAYOUT, ...editing };
    const preVentureId = searchParams.get("venture");
    const preVenture = ventures.find((v) => v.id === preVentureId);
    return {
      ...EMPTY_LAYOUT,
      ventureId: preVenture?.id || "",
      ventureName: preVenture?.name || "",
      state: preVenture?.state || "",
      district: preVenture?.district || "",
      city: preVenture?.city || "",
    };
  });

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const setVenture = (ventureId) => {
    const v = ventures.find((x) => x.id === ventureId);
    setForm((p) => ({
      ...p,
      ventureId,
      ventureName: v?.name || "",
      state: p.state || v?.state || "",
      district: p.district || v?.district || "",
      city: p.city || v?.city || "",
    }));
    setErrors((p) => (p.ventureId ? { ...p, ventureId: undefined } : p));
  };

  const setAmenity = (key, value) =>
    setForm((p) => ({ ...p, amenities: { ...p.amenities, [key]: value } }));

  const validateStep = (target) => {
    const e = {};
    if (target === 0) {
      if (!form.name?.trim()) e.name = "Layout name is required";
      if (!form.ventureId) e.ventureId = "Select the parent venture";
    }
    if (target === 1) {
      if (form.mapUrl && !/^https?:\/\//i.test(form.mapUrl))
        e.mapUrl = "Enter a valid URL (https://...)";
    }
    if (target === 3) {
      if (form.totalArea && Number(form.totalArea) < 0) e.totalArea = "Area cannot be negative";
      if (form.plotCount && Number(form.plotCount) < 0) e.plotCount = "Plot count cannot be negative";
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

  const save = (status) => {
    const e = validateStep(0);
    if (Object.keys(e).length) {
      setErrors(e);
      setStep(0);
      toast.error("Please complete the required fields");
      return;
    }
    const payload = { ...form, status: status || form.status };
    if (editing) {
      updateLayout(editing.id, payload);
      toast.success("Layout updated successfully");
      navigate(`/dashboard/layouts/${editing.id}`);
    } else {
      const record = addLayout(payload);
      toast.success(status === "Draft" ? "Draft saved" : "Layout published successfully");
      navigate(`/dashboard/layouts/${record.id}`);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <FormSection title="Basic Information" columns={2}>
            <Input label="Layout Name" required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Green Valley — Phase 1" error={errors.name} className="form-section__full" />
            <Input label="Layout Code" value={form.code} onChange={(e) => setField("code", e.target.value)} placeholder="GVT-L1" />
            <Select label="Venture" required value={form.ventureId} onChange={setVenture} options={ventureOptions} placeholder="Select venture" searchable error={errors.ventureId} />
            <Textarea label="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} className="form-section__full" />
          </FormSection>
        );
      case 1:
        return (
          <FormSection title="Location" columns={2}>
            <Select label="State" value={form.state} onChange={(v) => setField("state", v)} options={STATES} />
            <Input label="District" value={form.district} onChange={(e) => setField("district", e.target.value)} />
            <Input label="City" value={form.city} onChange={(e) => setField("city", e.target.value)} />
            <Input label="Village" value={form.village} onChange={(e) => setField("village", e.target.value)} />
            <Input label="Survey Number" value={form.surveyNumber} onChange={(e) => setField("surveyNumber", e.target.value)} placeholder="142, 143" />
            <Input label="Google Maps URL" value={form.mapUrl} onChange={(e) => setField("mapUrl", e.target.value)} error={errors.mapUrl} placeholder="https://maps.google.com/?q=..." />
          </FormSection>
        );
      case 2:
        return (
          <FormSection title="Approval" columns={2}>
            <Select label="Approval Type" value={form.approval} onChange={(v) => setField("approval", v)} options={APPROVAL_TYPES} className="form-section__full" />
            <Input label="Approval Number" value={form.approvalNumber} onChange={(e) => setField("approvalNumber", e.target.value)} placeholder="DTCP/TS/2021/0842" />
            <Input label="Approval Date" type="date" value={form.approvalDate} onChange={(e) => setField("approvalDate", e.target.value)} />
          </FormSection>
        );
      case 3:
        return (
          <FormSection title="Specifications" columns={2}>
            <Input label="Total Area (acres)" type="number" value={form.totalArea} onChange={(e) => setField("totalArea", e.target.value)} error={errors.totalArea} />
            <Input label="Plot Count" type="number" value={form.plotCount} onChange={(e) => setField("plotCount", e.target.value)} error={errors.plotCount} />
            <div className="form-section__full layout-form__amenities">
              {LAYOUT_AMENITY_KEYS.map((a) => (
                <Switch
                  key={a.key}
                  label={a.label}
                  checked={form.amenities?.[a.key] || false}
                  onChange={(v) => setAmenity(a.key, v)}
                />
              ))}
            </div>
          </FormSection>
        );
      case 4:
        return (
          <FormSection title="Pricing" columns={2}>
            <Input label="Base Price (per sq.yd)" type="number" value={form.basePrice} onChange={(e) => setField("basePrice", e.target.value)} />
            <Input label="Current Price (per sq.yd)" type="number" value={form.currentPrice} onChange={(e) => setField("currentPrice", e.target.value)} />
            <Input label="Registration Charges" type="number" value={form.registrationCharges} onChange={(e) => setField("registrationCharges", e.target.value)} />
            <Input label="Development Charges" type="number" value={form.developmentCharges} onChange={(e) => setField("developmentCharges", e.target.value)} />
          </FormSection>
        );
      case 5:
        return (
          <FormSection title="Media" columns={1}>
            <Upload label="Layout Plan" accept="image/*,.pdf" value={form.layoutPlan} onChange={(v) => setField("layoutPlan", v)} variant="file" />
            <Upload label="Master Plan" accept="image/*,.pdf" value={form.masterPlan} onChange={(v) => setField("masterPlan", v)} variant="file" />
            <Upload label="Thumbnail / Banner" accept="image/*" value={form.banner} onChange={(v) => setField("banner", v)} />
            <Upload label="Gallery" accept="image/*" multiple value={form.gallery} onChange={(v) => setField("gallery", v)} />
            <Upload label="Brochure" accept=".pdf" value={form.brochure} onChange={(v) => setField("brochure", v)} variant="file" />
          </FormSection>
        );
      case 6:
        return (
          <FormSection title="Review & Publish" columns={2}>
            <SummaryCard label="Layout Name" value={form.name || "—"} tone="accent" />
            <SummaryCard label="Venture" value={form.ventureName || "—"} tone="info" />
            <SummaryCard label="Location" value={[form.city, form.district].filter(Boolean).join(", ") || "—"} tone="success" />
            <SummaryCard label="Total Area" value={formatArea(form.totalArea)} tone="primary" />
            <SummaryCard label="Plot Count" value={form.plotCount || "—"} tone="violet" />
            <SummaryCard label="Current Price" value={formatSqYardPrice(form.currentPrice)} tone="warning" />
            <Select label="Status" value={form.status} onChange={(v) => setField("status", v)} options={LAYOUT_STATUS} className="form-section__full" />
          </FormSection>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="layout-page layout-form-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title={editing ? "Edit Layout" : "Add Layout"}
        description={`Step ${step + 1} of ${WIZARD_STEPS.length} — ${WIZARD_STEPS[step].label}`}
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Cancel
          </Button>
        }
      />

      <div className="layout-wizard">
        <aside className="layout-wizard__steps">
          <Stepper steps={WIZARD_STEPS} current={step} onStepClick={(i) => i <= step && setStep(i)} orientation="vertical" />
        </aside>

        <div className="layout-wizard__content">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>

          <footer className="layout-wizard__footer">
            <Button variant="ghost" size="md" onClick={handlePrev} disabled={step === 0}>
              <FiArrowLeft /> Previous
            </Button>
            <div className="layout-wizard__footer-right">
              <Button variant="soft" size="md" onClick={() => save("Draft")}>
                <FiSave /> Save Draft
              </Button>
              {step < WIZARD_STEPS.length - 1 ? (
                <Button variant="accent" size="md" onClick={handleNext}>
                  Next <FiArrowRight />
                </Button>
              ) : (
                <Button variant="accent" size="md" onClick={() => save("Active")}>
                  Publish Layout
                </Button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
