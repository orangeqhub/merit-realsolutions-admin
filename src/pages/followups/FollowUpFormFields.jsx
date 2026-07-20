import { useState } from "react";
import Input from "../../components/ui/input/Input";
import Select from "../../components/ui/select/Select";
import Textarea from "../../components/ui/textarea/Textarea";
import {
  FOLLOWUP_TYPES,
  FOLLOWUP_PRIORITIES,
  EMPTY_FOLLOWUP,
} from "./constants";

const FORM_ID = "followup-form";

export default function FollowUpFormFields({ initialValues, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY_FOLLOWUP, ...initialValues });
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.leadName?.trim() && !form.customerName?.trim()) {
      next.leadName = "Lead or customer name is required";
    }
    if (!form.scheduledDate) next.scheduledDate = "Date is required";
    if (!form.assignedTo?.trim()) next.assignedTo = "Assignee is required";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit({
      ...form,
      customerId: form.customerId || null,
      customerName: form.customerName || null,
    });
  };

  return (
    <form id={FORM_ID} className="followups-form" onSubmit={handleSubmit} noValidate>
      <div className="followups-form__grid">
        <Input
          label="Lead Name"
          value={form.leadName}
          onChange={(e) => setField("leadName", e.target.value)}
          error={errors.leadName}
        />
        <Input
          label="Customer Name"
          value={form.customerName || ""}
          onChange={(e) => setField("customerName", e.target.value)}
        />
        <Select
          label="Type"
          value={form.type}
          onChange={(v) => setField("type", v)}
          options={FOLLOWUP_TYPES}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(v) => setField("priority", v)}
          options={FOLLOWUP_PRIORITIES}
        />
        <Input
          label="Scheduled Date"
          type="date"
          value={form.scheduledDate}
          onChange={(e) => setField("scheduledDate", e.target.value)}
          error={errors.scheduledDate}
          required
        />
        <Input
          label="Scheduled Time"
          type="time"
          value={form.scheduledTime}
          onChange={(e) => setField("scheduledTime", e.target.value)}
        />
        <div className="followups-form__full">
          <Input
            label="Assigned To"
            value={form.assignedTo}
            onChange={(e) => setField("assignedTo", e.target.value)}
            error={errors.assignedTo}
            required
          />
        </div>
        <div className="followups-form__full">
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </form>
  );
}

export { FORM_ID };
