import { Link } from "react-router-dom";
import InfoCard from "../cards/InfoCard";
import { formatINR } from "../../utils/format";

export function AssignedPartnerCard({ partner, assignedDate, profilePath }) {
  if (!partner) return null;
  const path = profilePath || `/dashboard/users/${partner.id}`;
  const name = partner.personal?.name || partner.name;
  const code = partner.partnerCode || partner.employeeCode;
  const mobile = partner.personal?.mobile || partner.mobile;
  return (
    <InfoCard title="Assigned Sales Team Member">
      <Link to={path} className="cp-assigned cp-assigned--link">
        {partner.photo ? <img src={partner.photo} alt="" className="cp-assigned__avatar" /> : null}
        <div className="cp-assigned__meta">
          <strong>{name}</strong>
          <span>
            {[code, mobile].filter(Boolean).join(' · ')}
          </span>
          {assignedDate && <span>Assigned {assignedDate}</span>}
        </div>
      </Link>
    </InfoCard>
  );
}

export function AssignedPartnersList({ partners = [], title = "Assigned Sales Team" }) {
  if (!partners.length) return null;
  return (
    <InfoCard title={title}>
      <ul className="cp-assigned-list">
        {partners.map(({ partner, assignedDate }) => (
          <li key={partner.id}>
            <Link to={`/dashboard/users/${partner.id}`} className="cp-assigned cp-assigned--link">
              {partner.photo ? <img src={partner.photo} alt="" className="cp-assigned__avatar cp-assigned__avatar--sm" /> : null}
              <div className="cp-assigned__meta">
                <strong>{partner.personal?.name || partner.name}</strong>
                <span>{partner.partnerCode || partner.employeeCode}</span>
                {assignedDate && <span>Since {assignedDate}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}

export function EntityRelationshipSummary({ items = [] }) {
  if (!items.length) return null;
  return (
    <InfoCard title="Related Records">
      <ul className="erp-rel-list">
        {items.map((item) => (
          <li key={item.key}>
            {item.to ? (
              <Link to={item.to} className="erp-rel-list__link">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </Link>
            ) : (
              <>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </>
            )}
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}

export function RevenueSummaryCard({ label = "Revenue", amount, bookings = 0 }) {
  return (
    <InfoCard title={label}>
      <div className="erp-rel-revenue">
        <strong>{formatINR(amount)}</strong>
        {bookings > 0 && <span>{bookings} booking{bookings !== 1 ? "s" : ""}</span>}
      </div>
    </InfoCard>
  );
}
