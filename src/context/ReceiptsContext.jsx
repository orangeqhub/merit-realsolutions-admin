/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { receiptService } from "../shared/services/domainServices.js";

const ReceiptsContext = createContext(null);

export function ReceiptsProvider({ children }) {
  const receipts = useCollection("receipts");

  const value = useMemo(
    () => ({
      receipts,
      getReceipt: (id) => receipts.find((r) => r.id === id),
      addReceipt: (data) => receiptService.createReceipt(data),
    }),
    [receipts]
  );

  return <ReceiptsContext.Provider value={value}>{children}</ReceiptsContext.Provider>;
}

export function ReceiptsLayout() {
  return (
    <ReceiptsProvider>
      <Outlet />
    </ReceiptsProvider>
  );
}

export function useReceipts() {
  const ctx = useContext(ReceiptsContext);
  if (!ctx) throw new Error("useReceipts must be used within ReceiptsProvider");
  return ctx;
}
