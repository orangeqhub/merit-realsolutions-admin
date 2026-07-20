/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { leadService } from "../shared/services/domainServices.js";
import { dataStore } from "../shared/repositories/dataStore.js";

const LeadsContext = createContext(null);
const today = () => new Date().toISOString().split("T")[0];

export function LeadsProvider({ children }) {
  const leads = useCollection("leads");

  const value = useMemo(
    () => ({
      leads,
      getLead: (id) => leads.find((l) => l.id === id),
      addLead: (data) => leadService.createLead(data),
      updateLead: (id, data) => leadService.updateLead(id, data),
      updateLeadStatus: (id, status) => {
        dataStore.updateList("leads", (list) =>
          list.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status,
                  lastUpdated: today(),
                  timeline: [
                    { type: "status", title: `Status → ${status}`, description: "", date: today(), tone: "info" },
                    ...(x.timeline || []),
                  ],
                }
              : x
          )
        );
      },
      removeLead: (id) => leadService.deleteLead(id),
    }),
    [leads]
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function LeadsLayout() {
  return (
    <LeadsProvider>
      <Outlet />
    </LeadsProvider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
