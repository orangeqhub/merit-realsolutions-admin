/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { usePlots as usePlotsHook } from "../shared/hooks/usePlots.js";

const PlotsContext = createContext(null);

export function PlotsProvider({ children }) {
  const value = usePlotsHook();
  return <PlotsContext.Provider value={value}>{children}</PlotsContext.Provider>;
}

export function PlotsLayout() {
  return (
    <PlotsProvider>
      <Outlet />
    </PlotsProvider>
  );
}

export function usePlots() {
  const ctx = useContext(PlotsContext);
  if (!ctx) throw new Error("usePlots must be used within PlotsProvider");
  return ctx;
}
