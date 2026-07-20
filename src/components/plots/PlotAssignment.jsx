import { useState } from "react";
import { FiUserCheck } from "react-icons/fi";
import Input from "../ui/input/Input";
import Textarea from "../ui/textarea/Textarea";
import "./PlotAssignment.css";

/**
 * Assignment form for a plot — customer, sales agent, executive, CRM owner,
 * reservation expiry and booking notes. Used inside a drawer on the details page.
 * `onChange` reports the working assignment so the parent can persist on save.
 */
export default function PlotAssignment({ plot, onChange }) {
  const [form, setForm] = useState({
    customer: plot.customer || "",
    agent: plot.agent || "",
    executive: plot.executive || "",
    crmOwner: plot.crmOwner || "",
    reservationExpiry: plot.reservationExpiry || "",
    notes: plot.notes || "",
  });

  const set = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange?.(next);
  };

  return (
    <div className="plot-assignment">
      <div className="plot-assignment__intro">
        <span className="plot-assignment__icon">
          <FiUserCheck />
        </span>
        <div>
          <h4>Assign Plot {plot.plotNumber}</h4>
          <p>Link a customer, sales team and reservation details to this plot.</p>
        </div>
      </div>

      <div className="plot-assignment__grid">
        <Input label="Customer" value={form.customer} onChange={(e) => set("customer", e.target.value)} placeholder="Customer name" />
        <Input label="Sales Agent" value={form.agent} onChange={(e) => set("agent", e.target.value)} placeholder="Agent name" />
        <Input label="Executive" value={form.executive} onChange={(e) => set("executive", e.target.value)} placeholder="Executive name" />
        <Input label="CRM Owner" value={form.crmOwner} onChange={(e) => set("crmOwner", e.target.value)} placeholder="CRM owner" />
        <Input label="Reservation Expiry" type="date" value={form.reservationExpiry} onChange={(e) => set("reservationExpiry", e.target.value)} />
      </div>

      <Textarea
        label="Booking Notes"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={3}
        placeholder="Any notes about this assignment..."
      />
    </div>
  );
}
