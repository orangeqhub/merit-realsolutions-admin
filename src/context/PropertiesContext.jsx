/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { useProperties as usePropertiesHook } from "../shared/hooks/useProperties.js";

const PropertiesContext = createContext(null);

export function PropertiesProvider({ children }) {
  const value = usePropertiesHook();
  return <PropertiesContext.Provider value={value}>{children}</PropertiesContext.Provider>;
}

export function PropertiesLayout() {
  return (
    <PropertiesProvider>
      <Outlet />
    </PropertiesProvider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used within PropertiesProvider");
  return ctx;
}
