/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { companyService } from "../shared/services/domainServices.js";

const CompaniesContext = createContext(null);

export function CompaniesProvider({ children }) {
  const companies = useCollection("companies");

  const value = useMemo(
    () => ({
      companies,
      getCompany: (id) => companies.find((c) => c.id === id),
      addCompany: (data) => companyService.createCompany(data),
      updateCompany: (id, data) => companyService.updateCompany(id, data),
      removeCompany: (id) => companyService.deleteCompany(id),
    }),
    [companies]
  );

  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>;
}

export function CompaniesLayout() {
  return (
    <CompaniesProvider>
      <Outlet />
    </CompaniesProvider>
  );
}

export function useCompanies() {
  const ctx = useContext(CompaniesContext);
  if (!ctx) throw new Error("useCompanies must be used within CompaniesProvider");
  return ctx;
}
