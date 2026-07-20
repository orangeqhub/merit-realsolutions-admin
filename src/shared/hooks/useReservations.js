import { useMemo } from "react";
import { useCollection, useStoreObject } from "./useDataStore.js";
import { enrichReservations } from "../../services/reservation/reservationService.js";
import { getReservationDashboardStatistics } from "../services/statisticsService.js";

export function useReservations() {
  const reservationsData = useStoreObject("reservations");
  const settings = useStoreObject("reservationSettings") || {};

  return useMemo(() => {
    const raw = reservationsData?.reservations || [];
    const reservations = enrichReservations(raw, settings);
    return {
      reservations,
      raw,
      settings,
      loading: false,
      error: null,
      statistics: getReservationDashboardStatistics(),
      getReservation: (id) => reservations.find((r) => r.id === id),
      getByPlot: (plotId) => reservations.filter((r) => r.plotId === plotId),
      getByCustomer: (customerId) => reservations.filter((r) => r.customerId === customerId),
      getByPartner: (partnerId) => reservations.filter((r) => r.partnerId === partnerId),
      getByVenture: (ventureId) => reservations.filter((r) => r.ventureId === ventureId),
      getByLayout: (layoutId) => reservations.filter((r) => r.layoutId === layoutId),
    };
  }, [reservationsData, settings]);
}
