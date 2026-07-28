import { useMemo, useState } from "react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { motion } from "framer-motion";

import { FiArrowLeft, FiInfo, FiSave } from "react-icons/fi";

import PageHeader from "../../components/layout/PageHeader";

import Button from "../../components/ui/button/Button";

import Input from "../../components/ui/input/Input";

import Select from "../../components/ui/select/Select";

import Upload from "../../components/ui/upload/Upload";

import FormSection from "../../components/forms/FormSection";

import { useLayouts } from "../../context/LayoutsContext";

import { useVentures } from "../../shared/hooks/useVentures.js";

import { useToast } from "../../components/feedback/Toast";

import {

  LAYOUT_STATUS,

  APPROVAL_TYPES,

  EMPTY_LAYOUT,

  formatArea,

} from "./constants";

import { LAYOUT_LABELS, LAYOUT_MESSAGES } from "./layoutTerminology";
import { fileToDataUrl } from "../../utils/media.js";
import "./layout.css";



export default function LayoutForm() {

  const { id } = useParams();

  const navigate = useNavigate();

  const toast = useToast();

  const [searchParams] = useSearchParams();

  const { getLayout, getLayoutRecord, addLayout, updateLayout } = useLayouts();

  const { ventures } = useVentures();

  const editing = id ? getLayout(id) || getLayoutRecord(id) : null;



  const ventureOptions = useMemo(

    () => ventures.map((v) => ({ value: v.id, label: v.name })),

    [ventures]

  );



  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(() => {

    if (editing) {

      return {

        ...EMPTY_LAYOUT,

        name: editing.name || "",

        code: editing.code || "",

        ventureId: editing.ventureId || "",

        ventureName: editing.ventureName || "",

        surveyNumber: editing.surveyNumber || "",

        totalArea: editing.totalArea || "",

        approval: editing.approval || "Pending",

        approvalNumber: editing.approvalNumber || "",

        approvalDate: editing.approvalDate || "",

        status: editing.status || "Draft",

        description: editing.description || editing.layoutNotes || "",

        banner: editing.banner || null,

        layoutPlan: editing.layoutPlan || null,

      };

    }

    const preVentureId = searchParams.get("venture");

    const preVenture = ventures.find((v) => v.id === preVentureId);

    return {

      ...EMPTY_LAYOUT,

      ventureId: preVenture?.id || "",

      ventureName: preVenture?.name || "",

    };

  });



  const selectedVenture = useMemo(

    () => ventures.find((v) => v.id === form.ventureId) || null,

    [ventures, form.ventureId]

  );



  const locationLabel = useMemo(() => {

    if (!selectedVenture) return "—";

    return [selectedVenture.village, selectedVenture.city, selectedVenture.district, selectedVenture.state]

      .filter(Boolean)

      .join(", ");

  }, [selectedVenture]);



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

    }));

    setErrors((p) => (p.ventureId ? { ...p, ventureId: undefined } : p));

  };



  const validate = () => {

    const e = {};

    if (!form.name?.trim()) e.name = "Layout name is required";

    if (!form.ventureId) e.ventureId = "Select the parent venture";

    if (form.totalArea && Number(form.totalArea) < 0) e.totalArea = "Area cannot be negative";

    return e;

  };



  const save = async (status) => {

    const e = validate();

    if (Object.keys(e).length) {

      setErrors(e);

      toast.error("Please fix the highlighted fields");

      return;

    }



    let cover = form.banner || form.layoutPlan;

    if (cover instanceof File) {
      // Upload to backend during save — avoid base64 in localStorage when DB is available.
    } else if (typeof cover === 'string' && cover.startsWith('data:')) {
      // Keep data URL only as fallback; layoutService uploads when backend is ready.
    } else if (!cover) {
      cover = '';
    }

    const payload = {

      name: form.name,

      code: form.code,

      ventureId: form.ventureId,

      surveyNumber: form.surveyNumber,

      totalArea: form.totalArea,

      approval: form.approval,

      approvalNumber: form.approvalNumber,

      approvalDate: form.approvalDate,

      layoutNotes: form.description,

      description: form.description,

      layoutPlan: cover,

      banner: cover,

      status: status || form.status,

    };



    if (editing) {

      await updateLayout(editing.id, payload);

      toast.success("Layout metadata updated");

      navigate(`/dashboard/layouts/${editing.id}`);

    } else {

      const record = await addLayout(payload);

      toast.success(status === "Draft" ? "Layout draft saved" : "Layout created — add GIS data from the dashboard");

      navigate(`/dashboard/layouts/${record.id}`);

    }

  };



  return (

    <motion.div

      className="layout-page layout-form-page layout-form-page--metadata"

      initial={{ opacity: 0 }}

      animate={{ opacity: 1 }}

    >

      <PageHeader

        title={editing ? "Edit Layout Metadata" : LAYOUT_LABELS.addLayout}

        description="Create layout information only — GIS township data is imported or generated separately."

        actions={

          <Button variant="ghost" size="md" onClick={() => navigate(-1)}>

            <FiArrowLeft /> Cancel

          </Button>

        }

      />



      <div className="layout-metadata-form">

        <div className="layout-metadata-form__notice" role="note">

          <FiInfo aria-hidden />

          <p>{LAYOUT_MESSAGES.metadataOnlyHint}</p>

        </div>



        <FormSection title="Basic Information" columns={2}>

          <Input

            label="Layout Name"

            required

            value={form.name}

            onChange={(e) => setField("name", e.target.value)}

            placeholder="Green Valley — Phase 1"

            error={errors.name}

            className="form-section__full"

          />

          <Input

            label="Layout Code"

            value={form.code}

            onChange={(e) => setField("code", e.target.value)}

            placeholder="GVT-L1"

          />

          <Select

            label="Venture"

            required

            value={form.ventureId}

            onChange={setVenture}

            options={ventureOptions}

            placeholder="Select venture"

            searchable

            error={errors.ventureId}

          />

          <Input

            label="Location"

            value={locationLabel}

            readOnly

            hint="Inherited from venture — edit on the Venture form"

          />

          <Select

            label="Layout Status"

            value={form.status}

            onChange={(v) => setField("status", v)}

            options={LAYOUT_STATUS}

          />

        </FormSection>



        <FormSection title="Approval & Area" columns={2}>

          <Select

            label="Approval Type"

            value={form.approval}

            onChange={(v) => setField("approval", v)}

            options={APPROVAL_TYPES}

          />

          <Input

            label="Approval Number"

            value={form.approvalNumber}

            onChange={(e) => setField("approvalNumber", e.target.value)}

            placeholder="DTCP/LAO/2024/1187"

          />

          <Input

            label="Approval Date"

            type="date"

            value={form.approvalDate}

            onChange={(e) => setField("approvalDate", e.target.value)}

          />

          <Input

            label="Survey Number"

            value={form.surveyNumber}

            onChange={(e) => setField("surveyNumber", e.target.value)}

            placeholder="412/1, 412/2"

          />

          <Input

            label="Total Area (acres)"

            type="number"

            value={form.totalArea}

            onChange={(e) => setField("totalArea", e.target.value)}

            error={errors.totalArea}

            hint="Declared layout extent — optional at creation"

          />

        </FormSection>



        <FormSection title="Presentation" columns={1}>

          <Upload

            label="Cover Image"

            accept="image/*"

            value={form.banner || form.layoutPlan}

            onChange={(v) => {

              setField("banner", v);

              setField("layoutPlan", v);

            }}

            variant="file"

            hint="Used on the layout dashboard banner"

          />

          <Input

            label="Description"

            value={form.description}

            onChange={(e) => setField("description", e.target.value)}

            placeholder="Brief description of this layout phase…"

            className="form-section__full"

          />

        </FormSection>



        {editing ? (

          <FormSection title="Summary" columns={2}>

            <div className="layout-metadata-form__summary-item">

              <span>Area</span>

              <strong>{formatArea(form.totalArea)}</strong>

            </div>

            <div className="layout-metadata-form__summary-item">

              <span>Status</span>

              <strong>{form.status}</strong>

            </div>

          </FormSection>

        ) : null}



        <footer className="layout-metadata-form__footer">

          <Button variant="soft" size="md" onClick={() => save("Draft")}>

            <FiSave /> Save Draft

          </Button>

          <Button variant="accent" size="md" onClick={() => save(form.status === "Draft" ? "Active" : form.status)}>

            {editing ? "Save Changes" : "Create Layout"}

          </Button>

        </footer>

      </div>

    </motion.div>

  );

}


