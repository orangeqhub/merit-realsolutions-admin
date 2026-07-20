/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { agreementService } from "../shared/services/domainServices.js";

const AgreementsContext = createContext(null);

export function AgreementsProvider({ children }) {
  const agreements = useCollection("agreements");

  const value = useMemo(
    () => ({
      agreements,
      getAgreement: (id) => agreements.find((a) => a.id === id),
      addAgreement: (data) => agreementService.createAgreement(data),
      updateAgreement: (id, data) => agreementService.updateAgreement(id, data),
    }),
    [agreements]
  );

  return <AgreementsContext.Provider value={value}>{children}</AgreementsContext.Provider>;
}

export function AgreementsLayout() {
  return (
    <AgreementsProvider>
      <Outlet />
    </AgreementsProvider>
  );
}

export function useAgreements() {
  const ctx = useContext(AgreementsContext);
  if (!ctx) throw new Error("useAgreements must be used within AgreementsProvider");
  return ctx;
}
