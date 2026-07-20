import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Input from "../../../components/ui/input/Input";
import { useReservations } from "../../../context/ReservationContext";
import "../../../components/reservation/reservation.css";

export default function ActivityLogs() {
  const { getActivityLogs } = useReservations();
  const [search, setSearch] = useState("");

  const logs = useMemo(() => {
    const all = getActivityLogs();
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((log) =>
      [log.user, log.role, log.action, log.remarks, log.reservationRef, log.customerName, log.plotNumber]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [getActivityLogs, search]);

  return (
    <div className="rsv-page reservation-domain">
      <PageHeader
        eyebrow="Reservation Engine"
        title="Activity Logs"
        description="Immutable audit trail of every reservation action — user, role, action, timestamp, and remarks."
        breadcrumb={[
          { label: "Reservation Engine", to: "/dashboard/reservations" },
          { label: "Activity Logs" },
        ]}
      />

      <div className="rsv-list-toolbar">
        <Input
          placeholder="Search activity logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<FiSearch />}
        />
        <span>{logs.length} entries</span>
      </div>

      <section className="rsv-panel">
        <table className="rsv-activity-table">
          <thead>
            <tr>
              <th>Reservation</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Timestamp</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <Link to={`/dashboard/reservations/${log.reservationId}`}>
                    {log.reservationRef}
                  </Link>
                  <br />
                  <span className="rsv-timeline__meta">{log.customerName} · {log.plotNumber}</span>
                </td>
                <td>{log.user}</td>
                <td>{log.role}</td>
                <td>{log.action}</td>
                <td>{new Date(log.timestamp).toLocaleString("en-IN")}</td>
                <td>{log.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && <p className="rsv-empty-hint">No activity logs found.</p>}
      </section>
    </div>
  );
}
