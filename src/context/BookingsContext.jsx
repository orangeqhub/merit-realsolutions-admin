/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useCollection } from "../shared/hooks/useDataStore.js";
import { bookingService } from "../shared/services/domainServices.js";

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const bookings = useCollection("bookings");

  const value = useMemo(
    () => ({
      bookings,
      getBooking: (id) => bookings.find((b) => b.id === id),
      addBooking: (data) => bookingService.createBooking(data),
      updateBooking: (id, data) => bookingService.updateBooking(id, data),
      removeBooking: (id) => bookingService.deleteBooking(id),
    }),
    [bookings]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function BookingsLayout() {
  return (
    <BookingsProvider>
      <Outlet />
    </BookingsProvider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
}
