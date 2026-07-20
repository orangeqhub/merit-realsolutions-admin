import { useState } from "react";
import Input from "../../components/ui/input/Input";
import Select from "../../components/ui/select/Select";
import Textarea from "../../components/ui/textarea/Textarea";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_SOURCES,
  KYC_STATUSES,
  EMPTY_CUSTOMER,
} from "./constants";

const FORM_ID = "customer-form";

export default function CustomerFormFields({ initialValues, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY_CUSTOMER, ...initialValues });
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone is required";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit(form);
  };

  return (
    <form id={FORM_ID} className="customers-form" onSubmit={handleSubmit} noValidate>
      <div className="customers-form__grid">
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
          error={errors.phone}
          required
        />
        <Input
          label="Alternate Phone"
          value={form.alternatePhone}
          onChange={(e) => setField("alternatePhone", e.target.value)}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(v) => setField("status", v)}
          options={CUSTOMER_STATUSES}
        />
        <Select
          label="KYC Status"
          value={form.kycStatus}
          onChange={(v) => setField("kycStatus", v)}
          options={KYC_STATUSES}
        />
        <Input
          label="City"
          value={form.city}
          onChange={(e) => setField("city", e.target.value)}
        />
        <Input
          label="State"
          value={form.state}
          onChange={(e) => setField("state", e.target.value)}
        />
        <div className="customers-form__full">
          <Textarea
            label="Address"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            rows={2}
          />
        </div>
        <Input
          label="PAN"
          value={form.pan}
          onChange={(e) => setField("pan", e.target.value)}
        />
        <Input
          label="Aadhar"
          value={form.aadhar}
          onChange={(e) => setField("aadhar", e.target.value)}
        />
        <Input
          label="Occupation"
          value={form.occupation}
          onChange={(e) => setField("occupation", e.target.value)}
        />
        <Select
          label="Source"
          value={form.source}
          onChange={(v) => setField("source", v)}
          options={CUSTOMER_SOURCES}
          placeholder="Select source"
        />
        <Input
          label="Assigned Agent"
          value={form.assignedAgent}
          onChange={(e) => setField("assignedAgent", e.target.value)}
        />
      </div>
    </form>
  );
}

export { FORM_ID };
