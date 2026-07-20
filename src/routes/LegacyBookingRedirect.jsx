import { Navigate, useLocation } from "react-router-dom";

/** Legacy plot-booking URLs → property booking module. */
export default function LegacyBookingRedirect() {
  const location = useLocation();
  const match = location.pathname.match(/\/dashboard\/bookings(?:\/([^/]+))?/);
  const segment = match?.[1];

  if (segment && segment !== "list" && segment !== "new") {
    return (
      <Navigate
        to={`/dashboard/property-bookings/${segment}${location.search}`}
        replace
      />
    );
  }

  return <Navigate to="/dashboard/property-bookings" replace />;
}
