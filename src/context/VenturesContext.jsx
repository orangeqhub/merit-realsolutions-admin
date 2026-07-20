/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { useVentures as useVenturesHook } from "../shared/hooks/useVentures.js";

const VenturesContext = createContext(null);

export function VenturesProvider({ children }) {
  const value = useVenturesHook();
  return <VenturesContext.Provider value={value}>{children}</VenturesContext.Provider>;
}

export function VenturesLayout() {
  return (
    <VenturesProvider>
      <Outlet />
    </VenturesProvider>
  );
}

export function useVentures() {
  const ctx = useContext(VenturesContext);
  if (!ctx) throw new Error("useVentures must be used within VenturesProvider");
  return ctx;
}
