import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiSave, FiX } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import Textarea from "../../components/ui/textarea/Textarea";
import Select from "../../components/ui/select/Select";
import Upload from "../../components/ui/upload/Upload";
import FormSection from "../../components/forms/FormSection";
import Stepper from "../../components/forms/Stepper";
import SummaryCard from "../../components/cards/SummaryCard";
import { useProperties } from "../../context/PropertiesContext";
import { useToast } from "../../components/feedback/Toast";
import { listSalesUsers, formatSalesUserOption } from "../../services/users/userApi.js";
import { listBuilderOptions } from "../../services/builder/builderApi.js";
import { getPropertyCatalog, listPropertyTypes } from "../../services/property/propertyCatalogApi.js";
import {
  PROPERTY_STATUS,
  FACINGS,
  FURNISHING_OPTIONS,
  AREA_UNITS,
  STATES,
  WIZARD_STEPS,
  EMPTY_PROPERTY,
  PROPERTY_LISTED_BY,
  BUILDER_DEVELOPER_LISTED_BY,
  LISTED_BY_DETAIL_FIELDS,
  formatListedBySummary,
  getListedByLabel,
  getListedByDetail,
  formatINR,
  formatArea,
} from "./constants";
import "./property.css";

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getProperty, addProperty, updateProperty } = useProperties();
  const [saving, setSaving] = useState(false);
  const editing = id ? getProperty(id) : null;

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [builders, setBuilders] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [form, setForm] = useState(() => {
    if (editing) return { ...EMPTY_PROPERTY, ...editing };
    return { ...EMPTY_PROPERTY };
  });

  useEffect(() => {
    let active = true;
    listPropertyTypes()
      .then((types) => { if (active) setPropertyTypes(types || []); })
      .catch(() => { if (active) setPropertyTypes([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    listBuilderOptions()
      .then((items) => { if (active) setBuilders(items || []); })
      .catch(() => { if (active) setBuilders([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    listSalesUsers()
      .then((users) => { if (active) setSalesUsers(users || []); })
      .catch(() => { if (active) setSalesUsers([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!form.propertyTypeId) {
      setCatalog(null);
      return;
    }
    let active = true;
    setCatalogLoading(true);
    getPropertyCatalog(form.propertyTypeId)
      .then((data) => { if (active) setCatalog(data); })
      .catch(() => { if (active) setCatalog(null); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [form.propertyTypeId]);

  const propertyTypeOptions = useMemo(
    () => propertyTypes.map((t) => ({ value: String(t.id), label: t.name })),
    [propertyTypes]
  );

  const builderOptions = useMemo(
    () => builders.map((b) => ({ value: String(b.id), label: `${b.builderName} (${b.builderCode})` })),
    [builders]
  );

  const assigneeOptions = useMemo(
    () => salesUsers.map(formatSalesUserOption),
    [salesUsers]
  );

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: undefined } : p));
  };

  const handleListedByChange = (value) => {
    setForm((prev) => ({
      ...prev,
      propertyListedBy: value,
      builderId: "",
      listedByName: "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.propertyListedBy;
      delete next.builderId;
      delete next.listedByName;
      return next;
    });
  };

  const setLocationField = (name, value) => {
    setForm((p) => ({ ...p, location: { ...p.location, [name]: value } }));
    setErrors((p) => (p[`location.${name}`] ? { ...p, [`location.${name}`]: undefined } : p));
  };

  const setSpecValue = (specificationId, value) => {
    setForm((p) => ({
      ...p,
      specificationValues: { ...p.specificationValues, [specificationId]: value },
    }));
  };

  const toggleAmenity = (amenityId) => {
    setForm((p) => {
      const ids = new Set(p.amenityIds || []);
      if (ids.has(amenityId)) ids.delete(amenityId);
      else ids.add(amenityId);
      return { ...p, amenityIds: [...ids] };
    });
  };

  const handlePropertyTypeChange = (typeId) => {
    const selected = propertyTypes.find((t) => String(t.id) === String(typeId));
    setForm((p) => ({
      ...p,
      propertyTypeId: typeId,
      propertyCategory: selected?.category || "",
      propertyTypeName: selected?.name || "",
      specificationValues: {},
      amenityIds: [],
    }));
    setErrors((p) => ({ ...p, propertyTypeId: undefined }));
  };

  const addDocumentFiles = (files) => {
    const incoming = Array.isArray(files) ? files : [files];
    setForm((p) => ({
      ...p,
      documents: [...(p.documents || []), ...incoming.filter(Boolean)],
    }));
  };

  const removeDocument = (index) => {
    setForm((p) => ({
      ...p,
      documents: (p.documents || []).filter((_, i) => i !== index),
    }));
  };

  const toggleDocumentPublic = (index) => {
    setForm((p) => ({
      ...p,
      documents: (p.documents || []).map((doc, i) =>
        i === index ? { ...doc, isPublic: !doc.isPublic } : doc
      ),
    }));
  };

  const validateStep = (target) => {
    const e = {};
    if (target === 0) {
      if (!form.name?.trim()) e.name = "Property name is required";
      if (!form.propertyTypeId) e.propertyTypeId = "Select a property type";
      if (!form.propertyListedBy) e.propertyListedBy = "Select who listed this property";
      if (!form.state?.trim()) e.state = "State is required";
    }
    if (target === 1) {
      if (!form.city?.trim()) e.city = "City is required";
      if (form.location?.mapUrl && !/^https?:\/\//i.test(form.location.mapUrl)) {
        e["location.mapUrl"] = "Enter a valid URL (https://...)";
      }
    }
    if (target === 4) {
      if (!form.finalPrice || Number(form.finalPrice) < 0) e.finalPrice = "Price is required";
    }
    if (target === 7) {
      if (!form.assigneeUserId) e.assigneeUserId = "Sales team member is required";
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

  const save = async (publish = false) => {
    const e = {
      ...validateStep(0),
      ...validateStep(1),
      ...validateStep(4),
      ...validateStep(7),
    };
    if (Object.keys(e).length) {
      setErrors(e);
      setStep(Object.keys(validateStep(0)).length ? 0 : Object.keys(validateStep(7)).length ? 7 : 4);
      toast.error("Please complete the required fields");
      return;
    }

    const payload = {
      ...form,
      area: Number(form.area) || null,
      finalPrice: Number(form.finalPrice) || 0,
      isPublished: publish,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateProperty(editing.id, payload, { isPublished: publish });
        toast.success(publish ? "Property updated and published." : "Property updated successfully.");
        navigate(`/dashboard/properties/${editing.id}`);
      } else {
        const record = await addProperty(payload, { isPublished: publish });
        toast.success(publish ? "Property created and published." : "Property created successfully.");
        navigate(`/dashboard/properties/${record.id}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save property.");
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeName = form.propertyTypeName || propertyTypes.find((t) => String(t.id) === String(form.propertyTypeId))?.name;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <FormSection title="Basic Information" columns={2}>
            <Input label="Property Name" required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Lakeview Residency" error={errors.name} className="form-section__full" />
            <Input label="Property Code" value={form.code} disabled placeholder="Auto-generated on save" />
            <Select label="Property Type" required value={form.propertyTypeId ? String(form.propertyTypeId) : ""} onChange={handlePropertyTypeChange} options={propertyTypeOptions} placeholder="Select type" error={errors.propertyTypeId} />
            <Select label="Property Listed By" required value={form.propertyListedBy || ""} onChange={handleListedByChange} options={PROPERTY_LISTED_BY} placeholder="Select listing source" error={errors.propertyListedBy} />
            {form.propertyListedBy === BUILDER_DEVELOPER_LISTED_BY ? (
              <Select
                label="Builder"
                clearable
                searchable
                value={form.builderId ? String(form.builderId) : ""}
                onChange={(v) => setField("builderId", v || "")}
                options={builderOptions}
                placeholder="Select builder (optional)"
                error={errors.builderId}
              />
            ) : LISTED_BY_DETAIL_FIELDS[form.propertyListedBy] ? (
              <Input
                label={LISTED_BY_DETAIL_FIELDS[form.propertyListedBy].label}
                value={form.listedByName || ""}
                onChange={(e) => setField("listedByName", e.target.value)}
                placeholder={LISTED_BY_DETAIL_FIELDS[form.propertyListedBy].placeholder}
                error={errors.listedByName}
              />
            ) : null}
            <Input label="Property Category" value={form.propertyCategory || catalog?.category || ""} disabled placeholder="Auto-filled from type" />
            <Select label="Status" value={form.status} onChange={(v) => setField("status", v)} options={PROPERTY_STATUS} />
            <Textarea label="Short Description" value={form.shortDescription || ""} onChange={(e) => setField("shortDescription", e.target.value)} rows={2} className="form-section__full" />
            <Textarea label="Description" value={form.description || ""} onChange={(e) => setField("description", e.target.value)} rows={4} className="form-section__full" />
          </FormSection>
        );
      case 1:
        return (
          <FormSection title="Location" columns={2}>
            <Select label="State" value={form.state} onChange={(v) => setField("state", v)} options={STATES} />
            <Input label="District" value={form.district} onChange={(e) => setField("district", e.target.value)} />
            <Input label="City" required value={form.city} onChange={(e) => setField("city", e.target.value)} error={errors.city} />
            <Input label="Locality" value={form.locality} onChange={(e) => setField("locality", e.target.value)} />
            <Textarea label="Address" value={form.address} onChange={(e) => setField("address", e.target.value)} rows={2} className="form-section__full" />
            <Input label="Pincode" value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} />
            <Input label="Google Maps URL" value={form.location?.mapUrl || ""} onChange={(e) => setLocationField("mapUrl", e.target.value)} error={errors["location.mapUrl"]} placeholder="https://maps.google.com/?q=..." className="form-section__full" />
            <Input label="Latitude" value={form.location?.latitude || ""} onChange={(e) => setLocationField("latitude", e.target.value)} />
            <Input label="Longitude" value={form.location?.longitude || ""} onChange={(e) => setLocationField("longitude", e.target.value)} />
          </FormSection>
        );
      case 2:
        return (
          <FormSection title="Specifications" columns={2}>
            {!form.propertyTypeId ? (
              <p className="form-section__full property-form__publish-note">Select a property type in Basic Information to load specifications.</p>
            ) : catalogLoading ? (
              <p className="form-section__full property-form__publish-note">Loading specifications...</p>
            ) : (catalog?.specifications || []).length === 0 ? (
              <p className="form-section__full property-form__publish-note">No specifications configured for this property type.</p>
            ) : (
              catalog.specifications.map((spec) => (
                <Input
                  key={spec.id}
                  label={spec.name}
                  value={form.specificationValues?.[spec.id] || ""}
                  onChange={(e) => setSpecValue(spec.id, e.target.value)}
                  placeholder={`Enter ${spec.name.toLowerCase()}`}
                />
              ))
            )}
          </FormSection>
        );
      case 3:
        return (
          <FormSection title="Amenities" columns={1}>
            {!form.propertyTypeId ? (
              <p className="property-form__publish-note">Select a property type to load amenities.</p>
            ) : catalogLoading ? (
              <p className="property-form__publish-note">Loading amenities...</p>
            ) : (catalog?.amenities || []).length === 0 ? (
              <p className="property-form__publish-note">No amenities configured for this property type.</p>
            ) : (
              <div className="property-form__amenity-tags">
                {catalog.amenities.map((amenity) => {
                  const selected = (form.amenityIds || []).includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      className={`property-form__amenity-tag ${selected ? "is-selected" : ""}`}
                      onClick={() => toggleAmenity(amenity.id)}
                    >
                      {amenity.name}
                      {selected ? <FiX /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </FormSection>
        );
      case 4:
        return (
          <FormSection title="Pricing" columns={2}>
            <Input label="Price" type="number" required value={form.finalPrice} onChange={(e) => setField("finalPrice", e.target.value)} error={errors.finalPrice} />
            <Select label="Negotiable" value={form.negotiable ? "yes" : "no"} onChange={(v) => setField("negotiable", v === "yes")} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
            <Input label="Registration Charges" type="number" value={form.registrationCharges} onChange={(e) => setField("registrationCharges", e.target.value)} />
            <Input label="Maintenance" type="number" value={form.maintenanceCharges} onChange={(e) => setField("maintenanceCharges", e.target.value)} />
            <Input label="Area" type="number" value={form.area} onChange={(e) => setField("area", e.target.value)} />
            <Select label="Area Unit" value={form.unit || "Sq.Ft"} onChange={(v) => setField("unit", v)} options={AREA_UNITS} />
            <Select label="Facing" value={form.facing} onChange={(v) => setField("facing", v)} options={FACINGS} placeholder="Optional" />
            <Select label="Furnishing" value={form.furnishing || ""} onChange={(v) => setField("furnishing", v)} options={FURNISHING_OPTIONS} placeholder="Optional" />
            <div className="form-section__full property-form__preview">
              <span>Listed Price</span>
              <strong>{formatINR(Number(form.finalPrice) || 0)}</strong>
            </div>
          </FormSection>
        );
      case 5:
        return (
          <FormSection title="Images" columns={1}>
            <Upload label="Thumbnail" accept="image/*" value={form.thumbnail} onChange={(v) => setField("thumbnail", v)} />
            <Upload label="Banner" accept="image/*" value={form.banner} onChange={(v) => setField("banner", v)} />
            <Upload label="Gallery" accept="image/*" multiple value={form.gallery} onChange={(v) => setField("gallery", v)} />
          </FormSection>
        );
      case 6:
        return (
          <FormSection title="Documents" columns={1}>
            <Upload label="Property Documents" accept=".pdf,.doc,.docx,image/*" multiple onChange={addDocumentFiles} />
            <div className="property-form__documents">
              {(form.documents || []).length === 0 && (
                <p className="property-form__publish-note">Upload title deeds, approvals, or other property documents.</p>
              )}
              {(form.documents || []).map((doc, index) => (
                <div key={`${doc.name || "doc"}-${index}`} className="property-form__document-row">
                  <span>{doc.name || doc.url || `Document ${index + 1}`}</span>
                  {!(doc instanceof File) && (
                    <label className="property-form__document-public">
                      <input type="checkbox" checked={Boolean(doc.isPublic)} onChange={() => toggleDocumentPublic(index)} />
                      Public on website
                    </label>
                  )}
                  <button type="button" onClick={() => removeDocument(index)} aria-label="Remove document"><FiX /></button>
                </div>
              ))}
            </div>
          </FormSection>
        );
      case 7:
        return (
          <FormSection title="Assignment" columns={2}>
            <Select
              label="Assign To"
              required
              value={form.assigneeUserId ? String(form.assigneeUserId) : ""}
              onChange={(v) => setField("assigneeUserId", v || "")}
              options={assigneeOptions}
              placeholder="Select sales team member"
              searchable
              error={errors.assigneeUserId}
            />
            <p className="form-section__full property-form__publish-note">
              Assign an Area Business Partner, Coordinator, or Executive responsible for this property.
            </p>
          </FormSection>
        );
      case 8:
        return (
          <FormSection title="Review & Save" columns={2}>
            <div className="form-section__full property-form__summary">
              <SummaryCard label="Property" value={form.name || "—"} tone="accent" />
              <SummaryCard label="Type" value={selectedTypeName || "—"} tone="info" />
              <SummaryCard label="Listed By" value={formatListedBySummary(form, builders)} tone="primary" />
              <SummaryCard label="Location" value={[form.city, form.district].filter(Boolean).join(", ") || "—"} tone="success" />
              <SummaryCard label="Area" value={form.area ? formatArea(form.area, form.unit) : "—"} tone="violet" />
              <SummaryCard label="Price" value={formatINR(Number(form.finalPrice) || 0)} tone="warning" />
              <SummaryCard label="Amenities" value={String((form.amenityIds || []).length)} tone="primary" />
            </div>
            <Select label="Status" value={form.status} onChange={(v) => setField("status", v)} options={PROPERTY_STATUS} className="form-section__full" />
            <p className="form-section__full property-form__publish-note">
              Save as draft to keep the property in admin only. Publish to make it visible on the website.
            </p>
          </FormSection>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div className="erp-module-page property-page property-form-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={editing ? "Edit Property" : "Add Property"}
        description={`Step ${step + 1} of ${WIZARD_STEPS.length} — ${WIZARD_STEPS[step].label}`}
        actions={
          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Cancel
          </Button>
        }
      />

      <div className="property-wizard">
        <aside className="property-wizard__steps">
          <Stepper steps={WIZARD_STEPS} current={step} onStepClick={(i) => i <= step && setStep(i)} orientation="vertical" />
        </aside>

        <div className="property-wizard__content">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            {renderStep()}
          </motion.div>

          <footer className="property-wizard__footer">
            <Button variant="ghost" size="md" onClick={handlePrev} disabled={step === 0}>
              <FiArrowLeft /> Previous
            </Button>
            <div className="property-wizard__footer-right">
              {step < WIZARD_STEPS.length - 1 ? (
                <Button variant="accent" size="md" onClick={handleNext}>
                  Next <FiArrowRight />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="md" onClick={() => save(false)} disabled={saving}>
                    <FiSave /> {editing ? "Save Draft" : "Save as Draft"}
                  </Button>
                  <Button variant="accent" size="md" onClick={() => save(true)} disabled={saving}>
                    <FiSave /> {editing ? "Update & Publish" : "Publish Property"}
                  </Button>
                </>
              )}
            </div>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
