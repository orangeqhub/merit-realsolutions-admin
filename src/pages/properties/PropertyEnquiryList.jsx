import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import Select from "../../components/ui/select/Select";
import {
  listPropertyEnquiries,
  updatePropertyEnquiry,
} from "../../services/property/propertyApi.js";
import { listSalesUsers, formatSalesUserOption } from "../../services/users/userApi.js";
import { useToast } from "../../components/feedback/Toast";
import "./property.css";

const STATUS_ACTIONS = [
  { value: "ASSIGNED", label: "Assign" },
  { value: "APPROVED", label: "Approve" },
  { value: "REJECTED", label: "Reject" },
  { value: "CONVERTED", label: "Convert to Customer" },
  { value: "CLOSED", label: "Close" },
];

export default function PropertyEnquiryList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = { pageSize: 100 };
      if (assigneeUserId) params.assigneeUserId = assigneeUserId;
      const result = await listPropertyEnquiries(params);
      setItems(result.items || []);
    } catch (err) {
      toast.error(err.message || "Failed to load enquiries.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listSalesUsers()
      .then((users) => setSalesUsers(users || []))
      .catch(() => setSalesUsers([]));
  }, []);

  useEffect(() => {
    load();
  }, [assigneeUserId]);

  const assigneeOptions = useMemo(
    () => [{ value: "", label: "All Sales Users" }, ...salesUsers.map(formatSalesUserOption)],
    [salesUsers]
  );

  const updateStatus = async (id, status) => {
    try {
      await updatePropertyEnquiry(id, { status });
      toast.success(`Enquiry marked as ${status}.`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update enquiry.");
    }
  };

  return (
    <motion.div className="erp-module-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Property Enquiries"
        description="Website enquiries linked to properties and assigned sales team members."
      />

      <div className="erp-toolbar" style={{ marginBottom: "1rem" }}>
        <Select
          label="Filter by Sales User"
          value={assigneeUserId}
          onChange={setAssigneeUserId}
          options={assigneeOptions}
          placeholder="All Sales Users"
          searchable
        />
        <Button variant="ghost" size="md" onClick={load}>Refresh</Button>
      </div>

      {loading && <p>Loading enquiries...</p>}

      {!loading && items.length === 0 && (
        <p>No property enquiries yet.</p>
      )}

      <div className="property-enquiry-list">
        {items.map((item) => (
          <article key={item.id} className="property-enquiry-card">
            <div className="property-enquiry-card__main">
              <div className="property-enquiry-card__header">
                <h3>{item.name}</h3>
                <Badge tone="info">{item.status}</Badge>
              </div>
              <p>{item.mobile} {item.email ? `· ${item.email}` : ""}</p>
              <p>{item.city || "—"}</p>
              <p className="property-enquiry-card__message">{item.message || "No message"}</p>
              <p>
                Property:{" "}
                {item.property ? (
                  <Link to={`/dashboard/properties/${item.property.id}`}>
                    {item.property.propertyTitle}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
              <p>
                Assigned To: {item.assignee?.name || "Unassigned"}
                {item.assignee?.roleLabel ? ` (${item.assignee.roleLabel})` : ""}
              </p>
              <p>Date: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</p>
            </div>
            <div className="property-enquiry-card__actions">
              {STATUS_ACTIONS.map((action) => (
                <Button
                  key={action.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => updateStatus(item.id, action.value)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}
