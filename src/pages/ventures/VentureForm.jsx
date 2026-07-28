import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useVentures } from "../../context/VenturesContext";
import { useToast } from "../../components/feedback/Toast";
import {
  PROPERTY_TYPES,
  VENTURE_STATUS,
  APPROVAL_TYPES,
  STATES,
  AMENITY_KEYS,
  WIZARD_STEPS,
  EMPTY_VENTURE,
  formatSqYardPrice,
} from "./constants";
import "./venture.css";

export default function VentureForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getVenture, addVenture, updateVenture } = useVentures();
  const editing = id ? getVenture(id) : null;

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() =>
    editing ? { ...EMPTY_VENTURE, ...editing, landmarks: (editing.landmarks || []).join("\n") } : { ...EMPTY_VENTURE }
  );

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };
  const setAmenity = (key, value) =>
    setForm((p) => ({ ...p, amenities: { ...p.amenities, [key]: value } }));

  const validateStep = (target) => {
    const e = {};
    if (target === 0) {
      if (!form.name?.trim()) e.name = "Venture name is required";
      if (!form.propertyType) e.propertyType = "Select a property type";
    }
    if (target === 1) {
      if (form.mapUrl && !/^https?:\/\//i.test(form.mapUrl))
        e.mapUrl = "Enter a valid URL (https://...)";
    }
    if (target === 3) {
      if (form.currentPrice && Number(form.currentPrice) < 0)
        e.currentPrice = "Price cannot be negative";
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
    const sellingRate = form.currentPrice || form.pricePerSqYard || form.basePrice || "";
    const payload = {
      ...form,
      currentPrice: sellingRate,
      pricePerSqYard: sellingRate,
      status: status || form.status,
    };
    if (editing) {
      updateVenture(editing.id, payload);
      toast.success("Venture updated successfully");
      if (payload.mapUrl) window.open(payload.mapUrl, "_blank", "noopener,noreferrer");
      navigate(`/dashboard/ventures/${editing.id}`);
    } else {
      const record = addVenture(payload);
      toast.success(status === "Draft" ? "Draft saved" : "Venture published successfully");
      if (payload.mapUrl) window.open(payload.mapUrl, "_blank", "noopener,noreferrer");
      navigate(`/dashboard/ventures/${record.id}`);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <FormSection title="Basic Information" columns={2}>
            <Input label="Venture Name" required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Green Valley Township" error={errors.name} className="form-section__full" />
            <Input label="Short Name" value={form.shortName} onChange={(e) => setField("shortName", e.target.value)} placeholder="Green Valley" />
            <Input label="Code" value={form.code} onChange={(e) => setField("code", e.target.value)} placeholder="GVT-001" />
            <Select label="Property Type" required value={form.propertyType} onChange={(v) => setField("propertyType", v)} options={PROPERTY_TYPES} error={errors.propertyType} />
            <Input label="Developer" value={form.developer} onChange={(e) => setField("developer", e.target.value)} placeholder="Developer name" className="form-section__full" />
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
            <Input label="Google Maps URL" value={form.mapUrl} onChange={(e) => setField("mapUrl", e.target.value)} error={errors.mapUrl} placeholder="https://maps.google.com/?q=..." className="form-section__full" />
            <Input label="Latitude" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} />
            <Input label="Longitude" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} />
            <Textarea label="Nearby Landmarks" hint="One per line" value={form.landmarks} onChange={(e) => setField("landmarks", e.target.value)} rows={4} className="form-section__full" />
          </FormSection>
        );
      case 2:
        return (
          <FormSection title="Legal & Approvals" columns={2}>
            <Input label="DTCP Number" value={form.dtcp} onChange={(e) => setField("dtcp", e.target.value)} />
            <Input label="RERA Number" value={form.rera} onChange={(e) => setField("rera", e.target.value)} />
            <Input label="Approval Number" value={form.approvalNumber} onChange={(e) => setField("approvalNumber", e.target.value)} />
            <Input label="Approval Date" type="date" value={form.approvalDate} onChange={(e) => setField("approvalDate", e.target.value)} />
            <Input label="Registration" value={form.registration} onChange={(e) => setField("registration", e.target.value)} className="form-section__full" />
            <Select label="Approval Status" value={form.approval} onChange={(v) => setField("approval", v)} options={APPROVAL_TYPES} className="form-section__full" />
          </FormSection>
        );
      case 3:
        return (
          <FormSection title="Pricing defaults" columns={2}>
            <Input
              label="Base / Launch Rate (per sq.yd)"
              type="number"
              value={form.basePrice}
              onChange={(e) => setField("basePrice", e.target.value)}
              hint="Optional historical / brochure rate"
            />
            <Input
              label="Selling Rate (per sq.yd)"
              type="number"
              value={form.currentPrice}
              onChange={(e) => {
                const value = e.target.value;
                setForm((p) => ({ ...p, currentPrice: value, pricePerSqYard: value }));
                setErrors((p) => (p.currentPrice ? { ...p, currentPrice: undefined } : p));
              }}
              error={errors.currentPrice}
              hint="Used as default for layouts, generation, and new plots"
              required
            />
            <Input
              label="Registration Charges (default)"
              type="number"
              value={form.registrationCharges}
              onChange={(e) => setField("registrationCharges", e.target.value)}
            />
            <Input
              label="Development Charges (default)"
              type="number"
              value={form.developmentCharges}
              onChange={(e) => setField("developmentCharges", e.target.value)}
            />
          </FormSection>
        );
      case 4:
        return (
          <FormSection title="Amenities" columns={2}>
            {AMENITY_KEYS.map((a) => (
              <Switch
                key={a.key}
                label={a.label}
                checked={form.amenities?.[a.key] || false}
                onChange={(v) => setAmenity(a.key, v)}
              />
            ))}
          </FormSection>
        );
      case 5:
        return (
          <FormSection title="Media" columns={1}>
            <Upload label="Banner Image" accept="image/*" value={form.banner} onChange={(v) => setField("banner", v)} />
            <Upload label="Thumbnail" accept="image/*" value={form.thumbnail} onChange={(v) => setField("thumbnail", v)} />
            <Upload label="Logo" accept="image/*" value={form.logo} onChange={(v) => setField("logo", v)} />
            <Upload label="Gallery" accept="image/*" multiple value={form.gallery} onChange={(v) => setField("gallery", v)} />
            <Upload label="Layout Plan" accept="image/*,.pdf" value={form.layoutPlan} onChange={(v) => setField("layoutPlan", v)} variant="file" />
            <Upload label="Brochure" accept=".pdf" value={form.brochure} onChange={(v) => setField("brochure", v)} variant="file" />
            <Upload label="Master Plan" accept="image/*,.pdf" value={form.masterPlan} onChange={(v) => setField("masterPlan", v)} variant="file" />
          </FormSection>
        );
      case 6:
        return (
          <FormSection title="SEO" columns={2}>
            <Input label="Slug" value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="green-valley-township" className="form-section__full" />
            <Input label="Meta Title" value={form.metaTitle} onChange={(e) => setField("metaTitle", e.target.value)} className="form-section__full" />
            <Textarea label="Meta Description" value={form.metaDescription} onChange={(e) => setField("metaDescription", e.target.value)} rows={3} className="form-section__full" />
            <Input label="Keywords" value={form.keywords} onChange={(e) => setField("keywords", e.target.value)} hint="Comma separated" className="form-section__full" />
          </FormSection>
        );
      case 7:
        return (
          <FormSection title="Review & Publish" columns={2}>
            <SummaryCard label="Venture Name" value={form.name || "—"} tone="accent" />
            <SummaryCard label="Property Type" value={form.propertyType || "—"} tone="info" />
            <SummaryCard label="Location" value={[form.city, form.district].filter(Boolean).join(", ") || "—"} tone="success" />
            <SummaryCard label="Developer" value={form.developer || "—"} />
            <SummaryCard label="Current Price" value={formatSqYardPrice(form.currentPrice)} tone="warning" />
            <SummaryCard label="Approval" value={form.approval || "—"} />
            <Select label="Status" value={form.status} onChange={(v) => setField("status", v)} options={VENTURE_STATUS} className="form-section__full" />
          </FormSection>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="venture-page venture-form-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title={editing ? "Edit Venture" : "Add Venture"}
        description={`Step ${step + 1} of ${WIZARD_STEPS.length} — ${WIZARD_STEPS[step].label}`}
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Cancel
          </Button>
        }
      />

      <div className="venture-wizard">
        <aside className="venture-wizard__steps">
          <Stepper steps={WIZARD_STEPS} current={step} onStepClick={(i) => i <= step && setStep(i)} orientation="vertical" />
        </aside>

        <div className="venture-wizard__content">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>

          <footer className="venture-wizard__footer">
            <Button variant="ghost" size="md" onClick={handlePrev} disabled={step === 0}>
              <FiArrowLeft /> Previous
            </Button>
            <div className="venture-wizard__footer-right">
              <Button variant="soft" size="md" onClick={() => save("Draft")}>
                <FiSave /> Save Draft
              </Button>
              {step < WIZARD_STEPS.length - 1 ? (
                <Button variant="accent" size="md" onClick={handleNext}>
                  Next <FiArrowRight />
                </Button>
              ) : (
                <Button variant="accent" size="md" onClick={() => save("Active")}>
                  Publish Venture
                </Button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
