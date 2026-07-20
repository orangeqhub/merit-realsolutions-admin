import { FiMapPin, FiCompass, FiNavigation } from "react-icons/fi";
import "./PlotMapCard.css";

export default function PlotMapCard({ plot }) {
  const location = [plot.city, plot.district, plot.state].filter(Boolean).join(", ");
  return (
    <section className="plot-map">
      <div className="plot-map__canvas" aria-hidden="true">
        <div className="plot-map__pin">
          <FiMapPin />
        </div>
        <span className="plot-map__compass">
          <FiCompass /> {plot.facing}
        </span>
      </div>
      <div className="plot-map__info">
        <h3>
          <FiNavigation /> Location
        </h3>
        <p>{location || "Location not set"}</p>
        <div className="plot-map__meta">
          <span>Road Width: <strong>{plot.roadWidth || "—"}</strong></span>
          <span>Facing: <strong>{plot.facing || "—"}</strong></span>
          {plot.corner && <span className="plot-map__corner">Corner Plot</span>}
        </div>
      </div>
    </section>
  );
}
