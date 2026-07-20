import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import { useCustomers } from "../../context/CustomersContext";
import { useToast } from "../../components/feedback/Toast";
import CustomerFormFields, { FORM_ID } from "./CustomerFormFields";
import "./customer.css";

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { getCustomer, addCustomer, updateCustomer } = useCustomers();
  const editing = id ? getCustomer(id) : null;

  if (id && !editing) {
    return (
      <div className="erp-module-page customers-page">
        <PageHeader title="Customer not found" description="This customer may have been removed." />
        <Button variant="accent" size="md" to="/dashboard/customers/list">
          <FiArrowLeft /> Back to Directory
        </Button>
      </div>
    );
  }

  const handleSubmit = (values) => {
    if (editing) {
      updateCustomer(editing.id, values);
      toast.success("Customer updated");
      navigate(`/dashboard/customers/${editing.id}`);
    } else {
      const created = addCustomer(values);
      toast.success("Customer created");
      navigate(`/dashboard/customers/${created.id}`);
    }
  };

  return (
    <motion.div
      className="erp-module-page customers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title={editing ? "Edit Customer" : "Add Customer"}
        description={
          editing
            ? `Update profile for ${editing.name}`
            : "Register a new customer in the Merit Real Solutions CRM."
        }
        actions={
          <>
            <Button variant="ghost" size="md" to={editing ? `/dashboard/customers/${editing.id}` : "/dashboard/customers/list"}>
              <FiArrowLeft /> Cancel
            </Button>
            <Button variant="accent" size="md" type="submit" form={FORM_ID}>
              <FiSave /> {editing ? "Save Changes" : "Create Customer"}
            </Button>
          </>
        }
      />

      <CustomerFormFields initialValues={editing} onSubmit={handleSubmit} />
    </motion.div>
  );
}
