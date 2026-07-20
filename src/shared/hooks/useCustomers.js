import { useMemo } from "react";
import { useCollection } from "./useDataStore.js";
import { customerService } from "../services/customerService.js";

export function useCustomers() {
  const customers = useCollection("customers");

  return useMemo(
    () => ({
      customers,
      loading: false,
      error: null,
      getCustomer: (id) => customers.find((c) => c.id === id),
      getStatistics: (id) => customerService.getStatistics(id),
      addCustomer: (data) => customerService.createCustomer(data),
      updateCustomer: (id, data) => customerService.updateCustomer(id, data),
      removeCustomer: (id) => customerService.deleteCustomer(id),
    }),
    [customers]
  );
}
