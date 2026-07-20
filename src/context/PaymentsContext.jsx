/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { paymentService } from "../shared/services/domainServices.js";
import { isOverdue } from "../pages/payments/constants";

const PaymentsContext = createContext(null);

export function PaymentsProvider({ children }) {
  const payments = useCollection("payments");

  const value = useMemo(() => {
    const pendingDues = payments.filter(
      (p) => p.status === "Pending" || p.status === "Overdue" || isOverdue(p)
    );
    return {
      payments,
      pendingDues,
      getPayment: (id) => payments.find((p) => p.id === id),
      addPayment: (data) => paymentService.createPayment(data),
      updatePayment: (id, data) => paymentService.updatePayment(id, data),
      removePayment: (id) => paymentService.deletePayment(id),
    };
  }, [payments]);

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function PaymentsLayout() {
  return (
    <PaymentsProvider>
      <Outlet />
    </PaymentsProvider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error("usePayments must be used within PaymentsProvider");
  return ctx;
}
