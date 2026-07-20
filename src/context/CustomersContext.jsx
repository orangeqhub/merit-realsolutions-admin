/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { BookingsProvider } from "./BookingsContext";
import { useCustomers as useCustomersHook } from "../shared/hooks/useCustomers.js";

const CustomersContext = createContext(null);

export function CustomersProvider({ children }) {
  const value = useCustomersHook();
  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}

export function CustomersLayout() {
  return (
    <CustomersProvider>
      <BookingsProvider>
        <Outlet />
      </BookingsProvider>
    </CustomersProvider>
  );
}

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomersProvider");
  return ctx;
}
