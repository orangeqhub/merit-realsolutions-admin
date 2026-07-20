import { FiDollarSign } from "react-icons/fi";
import { derivePricing, formatFull, formatRate } from "../../pages/plotInventory/constants";
import "./PlotPricingCard.css";

export default function PlotPricingCard({ plot }) {
  const p = derivePricing(plot);

  const rows = [
    { label: "Area", value: `${p.area} sq.yd` },
    { label: "Rate / sq.yd", value: formatRate(p.rate) },
    { label: "Base Price", value: formatFull(p.totalPrice) },
    { label: "Development Charges", value: formatFull(p.developmentCharges) },
    { label: "Registration Charges", value: formatFull(p.registrationCharges) },
  ];

  return (
    <section className="plot-pricing">
      <header className="plot-pricing__head">
        <span className="plot-pricing__icon">
          <FiDollarSign />
        </span>
        <h3>Pricing Breakdown</h3>
      </header>

      <div className="plot-pricing__rows">
        {rows.map((r) => (
          <div key={r.label} className="plot-pricing__row">
            <span>{r.label}</span>
            <strong>{r.value}</strong>
          </div>
        ))}
        {p.discount > 0 && (
          <div className="plot-pricing__row plot-pricing__row--discount">
            <span>Discount ({p.discountPct}%)</span>
            <strong>− {formatFull(p.discount)}</strong>
          </div>
        )}
        <div className="plot-pricing__row plot-pricing__row--offer">
          <span>Offer Price</span>
          <strong>{formatFull(p.offerPrice)}</strong>
        </div>
      </div>

      <div className="plot-pricing__total">
        <span>Final Price</span>
        <strong>{formatFull(p.finalPrice)}</strong>
      </div>
    </section>
  );
}
