import { useMemo, useState } from "react";
import RightDrawer from "../drawer/RightDrawer";
import Button from "../ui/button/Button";
import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import FormSection from "../forms/FormSection";
import EnquiryFormModal from "../enquiry/EnquiryFormModal.jsx";
import ReservationStatus from "./ReservationStatus";
import CountdownBadge from "./CountdownBadge";
import { formatINR, formatDate } from "../../utils/format";

export default function ReservationDrawer({
  open,
  onClose,
  plot,
  layout,
  venture,
  customers = [],
  minimumAmount = 0,
  onSubmit,
}) {
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const enquiryProperty = useMemo(() => {
    if (!plot) return null;
    return {
      id: plot.propertyId || venture?.propertyId || null,
      propertyTitle: `${venture?.name || 'Venture'} · Plot ${plot.plotNumber || plot.number || ''}`.trim(),
      title: `${venture?.name || 'Venture'} · Plot ${plot.plotNumber || plot.number || ''}`.trim(),
      propertyTypeName: layout?.name || 'Plot',
      location: [venture?.city, venture?.state].filter(Boolean).join(', '),
      price: formatINR(plot.finalPrice || plot.totalPrice),
      status: plot.status,
      area: plot.areaSqYards ? `${plot.areaSqYards} sq.yd` : plot.area,
      image: venture?.thumbnail || venture?.banner,
    };
  }, [plot, venture, layout]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` })),
    [customers]
  );

  const suggestedAmount = minimumAmount || (plot ? Math.round((plot.finalPrice || plot.totalPrice || 0) * 0.1) : 0);

  const handleClose = () => {
    setCustomerId("");
    setAmount("");
    setSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!plot || !customerId) return;
    setSubmitting(true);
    await onSubmit?.({
      plotId: plot.id,
      layoutId: layout?.id || plot.layoutId,
      ventureId: venture?.id || plot.ventureId,
      customerId,
      reservationAmount: Number(amount) || suggestedAmount,
    });
    setSubmitting(false);
    handleClose();
  };

  if (!plot) return null;

  const activeReservation = plot.status === "Reserved";

  return (
    <>
    <RightDrawer
      open={open}
      onClose={handleClose}
      title={`Plot ${plot.plotNumber}`}
      subtitle={layout?.name || plot.layoutName}
      size="lg"
      footer={
        activeReservation ? (
          <Button variant="ghost" onClick={handleClose}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="accent" onClick={handleSubmit} disabled={!customerId || submitting}>
              Submit Reservation
            </Button>
          </>
        )
      }
    >
      <div className="rsv-drawer-section">
        <h4>Plot Information</h4>
        <div className="rsv-drawer-grid">
          <div className="rsv-drawer-field">
            <span>Area</span>
            <strong>{plot.areaSqYards} sq.yd</strong>
          </div>
          <div className="rsv-drawer-field">
            <span>Facing</span>
            <strong>{plot.facing}</strong>
          </div>
          <div className="rsv-drawer-field">
            <span>Price</span>
            <strong>{formatINR(plot.finalPrice || plot.totalPrice)}</strong>
          </div>
          <div className="rsv-drawer-field">
            <span>Current Status</span>
            <ReservationStatus status={plot.status === "Available" ? "Available" : plot.status === "Reserved" ? "Reserved" : plot.status} />
          </div>
        </div>
      </div>

      {plot.reservationExpiry && (
        <div className="rsv-drawer-section">
          <CountdownBadge expiryDate={plot.reservationExpiry} status="Reserved" size="lg" />
        </div>
      )}

      {!activeReservation && (
        <>
          <FormSection title="Customer Information">
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={[{ value: "", label: "Select customer" }, ...customerOptions]}
              required
            />
          </FormSection>

          <FormSection title="Reservation Amount">
            <Input
              label="Minimum Reservation Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(suggestedAmount)}
              hint={`Suggested minimum: ${formatINR(suggestedAmount)}`}
            />
          </FormSection>
        </>
      )}

      <div className="rsv-drawer-section">
        <h4>Quick Actions</h4>
        <div className="rsv-quick-actions">
          {!activeReservation && (
            <Button variant="accent" size="sm" onClick={handleSubmit} disabled={!customerId}>
              Reserve
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleClose()}>
            Schedule Site Visit
          </Button>
          <Button variant="ghost" size="sm">Add to Wishlist</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEnquiryOpen(true)}
            disabled={!enquiryProperty?.id}
          >
            Enquiry
          </Button>
        </div>
      </div>

      {venture && (
        <div className="rsv-drawer-section">
          <div className="rsv-drawer-field">
            <span>Venture</span>
            <strong>{venture.name}</strong>
          </div>
          <div className="rsv-drawer-field">
            <span>Layout</span>
            <strong>{layout?.name || plot.layoutName}</strong>
          </div>
          {plot.reservationExpiry && (
            <div className="rsv-drawer-field">
              <span>Reservation Expiry</span>
              <strong>{formatDate(plot.reservationExpiry)}</strong>
            </div>
          )}
        </div>
      )}
    </RightDrawer>
    {enquiryOpen && enquiryProperty?.id ? (
      <EnquiryFormModal
        property={enquiryProperty}
        onClose={() => setEnquiryOpen(false)}
      />
    ) : null}
  </>
  );
}
