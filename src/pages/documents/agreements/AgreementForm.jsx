import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiFileText, FiSave } from "react-icons/fi";
import Breadcrumb from "../../../components/layout/Breadcrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import Textarea from "../../../components/ui/textarea/Textarea";
import Upload from "../../../components/ui/upload/Upload";
import FormSection from "../../../components/forms/FormSection";
import FormFooter from "../../../components/forms/FormFooter";
import { useAgreements } from "../../../context/AgreementsContext";
import { useBookings } from "../../../context/BookingsContext";
import { useToast } from "../../../components/feedback/Toast";
import { AGREEMENT_STATUSES, EMPTY_AGREEMENT } from "./constants";
import "../../../styles/module.css";
import "./agreements.css";

function agreementNumberFromIndex(count) {
  const year = new Date().getFullYear();
  return `AGR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export default function AgreementForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { agreements, addAgreement } = useAgreements();
  const { bookings } = useBookings();

  const [form, setForm] = useState(EMPTY_AGREEMENT);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  const bookingOptions = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "Cancelled")
        .map((b) => ({
          value: b.id,
          label: `${b.bookingNumber} — ${b.customerName} (${b.plotNumber})`,
        })),
    [bookings]
  );

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === form.bookingId),
    [bookings, form.bookingId]
  );

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.bookingId) next.bookingId = "Select a booking";
    if (!form.status) next.status = "Select a status";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const today = new Date().toISOString().split("T")[0];
    const docName = file?.name || "Sale Agreement";
    const record = addAgreement({
      agreementNumber: agreementNumberFromIndex(agreements.length),
      bookingId: form.bookingId,
      customerName: selectedBooking?.customerName || "",
      propertyName: selectedBooking?.propertyName || "",
      plotNumber: selectedBooking?.plotNumber || "",
      status: form.status,
      version: 1,
      signedDate: form.signedDate || null,
      expiryDate: null,
      documents: file
        ? [
            {
              id: `ad-new-${Date.now()}`,
              name: docName,
              type: "pdf",
              size: file.size ? `${(file.size / 1048576).toFixed(1)} MB` : "—",
              date: today,
              version: 1,
            },
          ]
        : [],
      versionHistory: [
        {
          version: 1,
          date: today,
          notes: form.notes || "Initial upload",
        },
      ],
      timeline: [
        {
          type: "created",
          title: "Agreement created",
          date: today,
          tone: "accent",
        },
      ],
    });

    toast.success(`Agreement ${record.agreementNumber} created`);
    navigate(`/dashboard/documents/agreements/${record.id}`);
  };

  return (
    <motion.div
      className="erp-module-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Breadcrumb
        items={[
          { label: "Agreements", to: "/dashboard/documents/agreements" },
          { label: "New Agreement" },
        ]}
      />

      <form onSubmit={handleSubmit} className="agreements-form-card">
        <FormSection
          title="Booking Link"
          description="Select the confirmed booking this agreement belongs to."
          icon={<FiFileText />}
          columns={2}
        >
          <Select
            label="Booking"
            value={form.bookingId}
            onChange={(v) => update("bookingId", v)}
            options={bookingOptions}
            placeholder="Select booking"
            searchable
            error={errors.bookingId}
          />
          <Input
            label="Customer"
            value={selectedBooking?.customerName || ""}
            readOnly
            placeholder="Auto-filled from booking"
          />
          <Input
            label="Property"
            value={selectedBooking?.propertyName || ""}
            readOnly
            placeholder="Auto-filled from booking"
          />
          <Input
            label="Plot"
            value={selectedBooking?.plotNumber || ""}
            readOnly
            placeholder="Auto-filled from booking"
          />
        </FormSection>

        <FormSection title="Agreement Details" columns={2}>
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => update("status", v)}
            options={AGREEMENT_STATUSES.map((s) => ({ value: s, label: s }))}
            error={errors.status}
          />
          <Input
            label="Signed Date"
            type="date"
            value={form.signedDate}
            onChange={(e) => update("signedDate", e.target.value)}
          />
          <div className="agreements-form__full-width">
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Version notes or remarks..."
              rows={3}
            />
          </div>
        </FormSection>

        <FormSection title="Upload Document" description="Attach the sale agreement PDF." columns={1}>
          <Upload
            label="Agreement Document"
            accept=".pdf,image/*"
            variant="file"
            value={file}
            onChange={setFile}
            hint="PDF up to 5MB"
          />
        </FormSection>

        <FormFooter
          left={
            <Button variant="ghost" size="md" type="button" to="/dashboard/documents/agreements">
              <FiArrowLeft /> Cancel
            </Button>
          }
        >
          <Button variant="accent" size="md" type="submit">
            <FiSave /> Save Agreement
          </Button>
        </FormFooter>
      </form>
    </motion.div>
  );
}
