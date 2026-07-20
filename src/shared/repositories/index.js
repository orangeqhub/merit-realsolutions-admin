import { mockGet, mockPost, mockPut, mockDelete } from "../api/mockApi.js";

export const ventureRepository = {
  getAll: () => mockGet("/ventures"),
  getById: (id) => mockGet(`/ventures/${id}`),
  getLayouts: (ventureId) => mockGet(`/ventures/${ventureId}/layouts`),
  create: (data) => mockPost("/ventures", data),
  update: (id, data) => mockPut(`/ventures/${id}`, data),
  delete: (id) => mockDelete(`/ventures/${id}`),
};

export const layoutRepository = {
  getAll: () => mockGet("/layouts"),
  getById: (id) => mockGet(`/layouts/${id}`),
  getByVenture: (ventureId) => mockGet(`/ventures/${ventureId}/layouts`),
  getPlots: (layoutId) => mockGet(`/layouts/${layoutId}/plots`),
  create: (data) => mockPost("/layouts", data),
  update: (id, data) => mockPut(`/layouts/${id}`, data),
  delete: (id) => mockDelete(`/layouts/${id}`),
};

export const plotRepository = {
  getAll: () => mockGet("/plots"),
  getById: (id) => mockGet(`/plots/${id}`),
  getByLayout: (layoutId) => mockGet(`/layouts/${layoutId}/plots`),
  create: (data) => mockPost("/plots", data),
  update: (id, data) => mockPut(`/plots/${id}`, data),
  delete: (id) => mockDelete(`/plots/${id}`),
};

export const customerRepository = {
  getAll: () => mockGet("/customers"),
  getById: (id) => mockGet(`/customers/${id}`),
  create: (data) => mockPost("/customers", data),
  update: (id, data) => mockPut(`/customers/${id}`, data),
  delete: (id) => mockDelete(`/customers/${id}`),
};

export const partnerRepository = {
  getAll: () => mockGet("/partners"),
  getById: (id) => mockGet(`/partners/${id}`),
  create: (data) => mockPost("/partners", data),
  update: (id, data) => mockPut(`/partners/${id}`, data),
  delete: (id) => mockDelete(`/partners/${id}`),
};

export const propertyRepository = {
  getAll: () => mockGet("/properties"),
  getById: (id) => mockGet(`/properties/${id}`),
  create: (data) => mockPost("/properties", data),
  update: (id, data) => mockPut(`/properties/${id}`, data),
  delete: (id) => mockDelete(`/properties/${id}`),
};

export const companyRepository = {
  getAll: () => mockGet("/companies"),
  getById: (id) => mockGet(`/companies/${id}`),
  create: (data) => mockPost("/companies", data),
  update: (id, data) => mockPut(`/companies/${id}`, data),
  delete: (id) => mockDelete(`/companies/${id}`),
};

export const bookingRepository = {
  getAll: () => mockGet("/bookings"),
  getById: (id) => mockGet(`/bookings/${id}`),
  create: (data) => mockPost("/bookings", data),
  update: (id, data) => mockPut(`/bookings/${id}`, data),
  delete: (id) => mockDelete(`/bookings/${id}`),
};

export const paymentRepository = {
  getAll: () => mockGet("/payments"),
  getById: (id) => mockGet(`/payments/${id}`),
  create: (data) => mockPost("/payments", data),
  update: (id, data) => mockPut(`/payments/${id}`, data),
  delete: (id) => mockDelete(`/payments/${id}`),
};

export const leadRepository = {
  getAll: () => mockGet("/leads"),
  getById: (id) => mockGet(`/leads/${id}`),
  create: (data) => mockPost("/leads", data),
  update: (id, data) => mockPut(`/leads/${id}`, data),
  delete: (id) => mockDelete(`/leads/${id}`),
};

export const followUpRepository = {
  getAll: () => mockGet("/followups"),
  getById: (id) => mockGet(`/followups/${id}`),
  create: (data) => mockPost("/followups", data),
  update: (id, data) => mockPut(`/followups/${id}`, data),
  delete: (id) => mockDelete(`/followups/${id}`),
};

export const agreementRepository = {
  getAll: () => mockGet("/agreements"),
  getById: (id) => mockGet(`/agreements/${id}`),
  create: (data) => mockPost("/agreements", data),
  update: (id, data) => mockPut(`/agreements/${id}`, data),
  delete: (id) => mockDelete(`/agreements/${id}`),
};

export const registrationRepository = {
  getAll: () => mockGet("/registrations"),
  getById: (id) => mockGet(`/registrations/${id}`),
  create: (data) => mockPost("/registrations", data),
  update: (id, data) => mockPut(`/registrations/${id}`, data),
  delete: (id) => mockDelete(`/registrations/${id}`),
};

export const receiptRepository = {
  getAll: () => mockGet("/receipts"),
  getById: (id) => mockGet(`/receipts/${id}`),
  create: (data) => mockPost("/receipts", data),
  update: (id, data) => mockPut(`/receipts/${id}`, data),
  delete: (id) => mockDelete(`/receipts/${id}`),
};

export const reservationRepository = {
  getAll: () => mockGet("/reservations"),
  getById: (id) => mockGet(`/reservations/${id}`),
  create: (data) => mockPost("/reservations", data),
  update: (id, data) => mockPut(`/reservations/${id}`, data),
  updateAction: (id, action, data) => mockPut(`/reservations/${id}/${action}`, data),
  delete: (id) => mockDelete(`/reservations/${id}`),
};

export const partnerAssignmentRepository = {
  getAll: () => mockGet("/partner-assignments"),
  updatePartner: (partnerId, assignment) => mockPut(`/partner-assignments/${partnerId}`, assignment),
};

export const engagementRepository = {
  get: () => mockGet("/engagement"),
  update: (data) => mockPut("/engagement", data),
};

export const reservationSettingsRepository = {
  get: () => mockGet("/reservation-settings"),
  update: (data) => mockPut("/reservation-settings", data),
};

export const reservationRulesRepository = {
  get: () => mockGet("/reservation-rules"),
  update: (data) => mockPut("/reservation-rules", data),
};
