/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { registrationService } from "../shared/services/domainServices.js";

const RegistrationsContext = createContext(null);

export function RegistrationsProvider({ children }) {
  const registrations = useCollection("registrations");

  const value = useMemo(
    () => ({
      registrations,
      getRegistration: (id) => registrations.find((r) => r.id === id),
      addRegistration: (data) => registrationService.createRegistration(data),
      updateRegistration: (id, data) => registrationService.updateRegistration(id, data),
    }),
    [registrations]
  );

  return <RegistrationsContext.Provider value={value}>{children}</RegistrationsContext.Provider>;
}

export function RegistrationsLayout() {
  return (
    <RegistrationsProvider>
      <Outlet />
    </RegistrationsProvider>
  );
}

export function useRegistrations() {
  const ctx = useContext(RegistrationsContext);
  if (!ctx) throw new Error("useRegistrations must be used within RegistrationsProvider");
  return ctx;
}
