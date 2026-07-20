/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { useLayouts as useLayoutsHook } from "../shared/hooks/useLayouts.js";

const LayoutsContext = createContext(null);

export function LayoutsProvider({ children }) {
  const value = useLayoutsHook();
  return <LayoutsContext.Provider value={value}>{children}</LayoutsContext.Provider>;
}

export function LayoutsLayout() {
  return (
    <LayoutsProvider>
      <Outlet />
    </LayoutsProvider>
  );
}

export function useLayouts() {
  const ctx = useContext(LayoutsContext);
  if (!ctx) throw new Error("useLayouts must be used within LayoutsProvider");
  return ctx;
}
