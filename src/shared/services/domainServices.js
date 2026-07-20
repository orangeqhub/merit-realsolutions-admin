import { dataStore } from "../repositories/dataStore.js";
import { companyService } from "./companyService.js";
import {
  bookingRepository,
  paymentRepository,
  leadRepository,
  followUpRepository,
  agreementRepository,
  registrationRepository,
  receiptRepository,
  partnerAssignmentRepository,
  engagementRepository,
  reservationSettingsRepository,
  reservationRulesRepository,
} from "../repositories/index.js";
import { getDashboardMetrics } from "./statisticsService.js";

export { companyService };

export const bookingService = {
  getAll: () => Promise.resolve(dataStore.getList("bookings")),
  getById: (id) => Promise.resolve(dataStore.getList("bookings").find((b) => b.id === id) || null),
  createBooking: (data) => bookingRepository.create(data),
  updateBooking: (id, data) => bookingRepository.update(id, data),
  deleteBooking: (id) => bookingRepository.delete(id),
};

export const paymentService = {
  getAll: () => Promise.resolve(dataStore.getList("payments")),
  getById: (id) => Promise.resolve(dataStore.getList("payments").find((p) => p.id === id) || null),
  createPayment: (data) => paymentRepository.create(data),
  updatePayment: (id, data) => paymentRepository.update(id, data),
  deletePayment: (id) => paymentRepository.delete(id),
};

export const leadService = {
  getAll: () => Promise.resolve(dataStore.getList("leads")),
  getById: (id) => Promise.resolve(dataStore.getList("leads").find((l) => l.id === id) || null),
  createLead: (data) => leadRepository.create(data),
  updateLead: (id, data) => leadRepository.update(id, data),
  deleteLead: (id) => leadRepository.delete(id),
};

export const followUpService = {
  getAll: () => Promise.resolve(dataStore.getList("followups")),
  getById: (id) => Promise.resolve(dataStore.getList("followups").find((f) => f.id === id) || null),
  createFollowUp: (data) => followUpRepository.create(data),
  updateFollowUp: (id, data) => followUpRepository.update(id, data),
  deleteFollowUp: (id) => followUpRepository.delete(id),
};

export const agreementService = {
  getAll: () => Promise.resolve(dataStore.getList("agreements")),
  getById: (id) => Promise.resolve(dataStore.getList("agreements").find((a) => a.id === id) || null),
  createAgreement: (data) => agreementRepository.create(data),
  updateAgreement: (id, data) => agreementRepository.update(id, data),
  deleteAgreement: (id) => agreementRepository.delete(id),
};

export const registrationService = {
  getAll: () => Promise.resolve(dataStore.getList("registrations")),
  getById: (id) => Promise.resolve(dataStore.getList("registrations").find((r) => r.id === id) || null),
  createRegistration: (data) => registrationRepository.create(data),
  updateRegistration: (id, data) => registrationRepository.update(id, data),
  deleteRegistration: (id) => registrationRepository.delete(id),
};

export const receiptService = {
  getAll: () => Promise.resolve(dataStore.getList("receipts")),
  getById: (id) => Promise.resolve(dataStore.getList("receipts").find((r) => r.id === id) || null),
  createReceipt: (data) => receiptRepository.create(data),
  updateReceipt: (id, data) => receiptRepository.update(id, data),
  deleteReceipt: (id) => receiptRepository.delete(id),
};

export const partnerAssignmentService = {
  getAll: () => partnerAssignmentRepository.getAll(),
  getAssignment: (partnerId) =>
    Promise.resolve(dataStore.getObject("partnerAssignments")?.assignments?.[partnerId] || null),
  updateAssignment: (partnerId, assignment) =>
    partnerAssignmentRepository.updatePartner(partnerId, assignment),
};

export const engagementService = {
  get: () => engagementRepository.get(),
  update: (data) => engagementRepository.update(data),
};

export const reservationConfigService = {
  getSettings: () => reservationSettingsRepository.get(),
  updateSettings: (data) => reservationSettingsRepository.update(data),
  getRules: () => reservationRulesRepository.get(),
  updateRules: (data) => reservationRulesRepository.update(data),
};

export const dashboardService = {
  getMetrics: () => Promise.resolve(getDashboardMetrics()),
};
