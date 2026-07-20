/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { CustomersProvider } from "./CustomersContext";
import { LeadsProvider } from "./LeadsContext";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { followUpService } from "../shared/services/domainServices.js";
import { dataStore } from "../shared/repositories/dataStore.js";

const FollowUpsContext = createContext(null);
const today = () => new Date().toISOString().split("T")[0];

export function FollowUpsProvider({ children }) {
  const followups = useCollection("followups");

  const value = useMemo(
    () => ({
      followUps: followups,
      followups,
      getFollowUp: (id) => followups.find((f) => f.id === id),
      addFollowUp: (data) => followUpService.createFollowUp(data),
      updateFollowUp: (id, data) => followUpService.updateFollowUp(id, data),
      completeFollowUp: (id) => {
        dataStore.updateList("followups", (list) =>
          list.map((x) => (x.id === id ? { ...x, status: "Completed", completedDate: today() } : x))
        );
      },
      removeFollowUp: (id) => followUpService.deleteFollowUp(id),
    }),
    [followups]
  );

  return <FollowUpsContext.Provider value={value}>{children}</FollowUpsContext.Provider>;
}

export function FollowUpsLayout() {
  return (
    <FollowUpsProvider>
      <LeadsProvider>
        <CustomersProvider>
          <Outlet />
        </CustomersProvider>
      </LeadsProvider>
    </FollowUpsProvider>
  );
}

export function useFollowUps() {
  const ctx = useContext(FollowUpsContext);
  if (!ctx) throw new Error("useFollowUps must be used within FollowUpsProvider");
  return ctx;
}
