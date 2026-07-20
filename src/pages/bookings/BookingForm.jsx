import { Link } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/button/Button";

export default function BookingForm() {
  return (
    <div className="erp-module-page">
      <PageHeader
        title="Create Booking"
        description="Property bookings are created through the customer website checkout flow."
      />
      <p>New bookings are recorded automatically when a customer reserves a published property online.</p>
      <p>Use the property bookings module to manage reservations, payments, and lifecycle actions.</p>
      <Button variant="accent" size="md" to="/dashboard/properties/property-bookings">Open property bookings</Button>
      <Button variant="ghost" size="md" to="/dashboard/bookings/list">View all bookings</Button>
    </div>
  );
}
