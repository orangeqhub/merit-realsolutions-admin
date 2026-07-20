import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import RightDrawer from "../../components/drawer/RightDrawer";
import { useFollowUps } from "../../context/FollowUpsContext";
import { useLeads } from "../../context/LeadsContext";
import { useCustomers } from "../../context/CustomersContext";
import { useToast } from "../../components/feedback/Toast";
import FollowUpFormFields, { FORM_ID } from "./FollowUpFormFields";
import { EMPTY_FOLLOWUP } from "./constants";
import "./followups.css";

export default function FollowUpForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { addFollowUp } = useFollowUps();
  const { getLead } = useLeads();
  const { getCustomer } = useCustomers();

  const leadId = searchParams.get("lead");
  const customerId = searchParams.get("customer");
  const lead = leadId ? getLead(leadId) : null;
  const customer = customerId ? getCustomer(customerId) : null;

  const [open, setOpen] = useState(true);
  const [form] = useState(() => ({
    ...EMPTY_FOLLOWUP,
    leadId: lead?.id || "",
    leadName: lead?.name || "",
    customerId: customer?.id || "",
    customerName: customer?.name || "",
    assignedTo: lead?.assignedExecutive || customer?.assignedAgent || "",
  }));

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  const handleSubmit = (values) => {
    addFollowUp(values);
    toast.success("Follow-up scheduled");
    setOpen(false);
    if (leadId) navigate(`/dashboard/leads/${leadId}`);
    else navigate("/dashboard/follow-ups/list");
  };

  return (
    <motion.div
      className="erp-module-page followups-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title="Schedule Follow-up"
        description="Create a new follow-up for a lead or customer."
        actions={
          <Button variant="ghost" size="md" onClick={handleClose}>
            <FiArrowLeft /> Back
          </Button>
        }
      />

      <RightDrawer
        open={open}
        onClose={handleClose}
        title="New Follow-up"
        subtitle="Schedule a call, meeting or site visit"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="accent" size="md" type="submit" form={FORM_ID}>
              Schedule
            </Button>
          </>
        }
      >
        <FollowUpFormFields initialValues={form} onSubmit={handleSubmit} />
      </RightDrawer>
    </motion.div>
  );
}
