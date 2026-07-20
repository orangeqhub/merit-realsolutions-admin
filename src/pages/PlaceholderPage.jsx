import { useParams } from "react-router-dom";
import "./PlaceholderPage.css";

const pageTitles = {
  ventures: "Ventures",
  layouts: "Layouts",
  agents: "Agents",
  customers: "Customers",
  payments: "Payments",
  reports: "Reports",
  settings: "Settings",
};

export default function PlaceholderPage() {
  const { section } = useParams();
  const title = pageTitles[section] || "Page";

  return (
    <div className="placeholder-page">
      <h1 className="placeholder-page__title">{title}</h1>
      <p className="placeholder-page__text">
        This section is under development. Content will be added soon.
      </p>
    </div>
  );
}
