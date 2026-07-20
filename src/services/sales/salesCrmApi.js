import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;
const SALES_CRM = `${API_V1}/admin/sales-crm`;

function authHeaders(json = false) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.errors = data.errors || [];
    throw error;
  }
  return data.data;
}

function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      return true;
    })
  );
  return new URLSearchParams(clean).toString();
}

export async function getSalesCrmDashboard() {
  const response = await fetch(`${SALES_CRM}/dashboard`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getSalesPerformance(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/performance${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getSalesPerformanceProfile(userId) {
  const response = await fetch(`${SALES_CRM}/performance/${userId}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getSalesPerformanceTeam(userId) {
  const response = await fetch(`${SALES_CRM}/performance/${userId}/team`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getSalesTeamCustomers(userId) {
  const response = await fetch(`${SALES_CRM}/performance/${userId}/customers`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function exportSalesPerformance(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/performance/export${query ? `?${query}` : ''}`, { headers: authHeaders() });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Export failed.');
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return { blob, filename: match?.[1] || 'sales-team-performance.csv' };
}

export async function getCustomer360Profile(customerId) {
  const response = await fetch(`${API_BASE_URL}/customers/${customerId}?profile=true`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listPropertyAssignments(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/property-assignments${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function assignPropertyToSalesUser(propertyId, payload) {
  const response = await fetch(`${SALES_CRM}/properties/${propertyId}/assign`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function getPropertyAssignmentHistory(propertyId) {
  const response = await fetch(`${SALES_CRM}/properties/${propertyId}/history`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listVentureAssignments(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/venture-assignments${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function assignVentureToSalesUser(payload) {
  const response = await fetch(`${SALES_CRM}/venture-assignments`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listSalesCustomers(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/customers${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createSalesCustomer(payload) {
  const response = await fetch(`${SALES_CRM}/customers`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listCustomerAssignments(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/customer-assignments${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function assignCustomerToSalesUser(customerId, payload) {
  const response = await fetch(`${SALES_CRM}/customers/${customerId}/assign`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listSalesLeads(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/leads${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getSalesLead(id) {
  const response = await fetch(`${SALES_CRM}/leads/${id}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createSalesLead(payload) {
  const response = await fetch(`${SALES_CRM}/leads`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function importSalesLeads(leads) {
  const response = await fetch(`${SALES_CRM}/leads/import`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ leads }),
  });
  return parseResponse(response);
}

export async function assignSalesLead(id, payload) {
  const response = await fetch(`${SALES_CRM}/leads/${id}/assign`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateSalesLead(id, payload) {
  const response = await fetch(`${SALES_CRM}/leads/${id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listSalesFollowups(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/followups${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createSalesFollowup(leadId, payload) {
  const response = await fetch(`${SALES_CRM}/leads/${leadId}/followups`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listSalesMeetings(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/meetings${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createSalesMeeting(payload) {
  const response = await fetch(`${SALES_CRM}/meetings`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateSalesMeeting(id, payload) {
  const response = await fetch(`${SALES_CRM}/meetings/${id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function completeSalesMeeting(id, payload) {
  const response = await fetch(`${SALES_CRM}/meetings/${id}/complete`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function rescheduleSalesMeeting(id, payload) {
  const response = await fetch(`${SALES_CRM}/meetings/${id}/reschedule`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function cancelSalesMeeting(id, reason = '') {
  const response = await fetch(`${SALES_CRM}/meetings/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
}

export async function snoozeSalesMeeting(id, minutes = 10) {
  const response = await fetch(`${SALES_CRM}/meetings/${id}/snooze`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ minutes }),
  });
  return parseResponse(response);
}

export async function fetchMeetingPopups() {
  const response = await fetch(`${SALES_CRM}/meetings/active-popups`, { headers: authHeaders() });
  const data = await parseResponse(response);
  return data?.items || [];
}

export const MEETING_OUTCOME_OPTIONS = [
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'NEED_FOLLOW_UP', label: 'Need Follow-up' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export async function listSalesCrmNotifications(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/notifications${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function markSalesCrmNotificationRead(id) {
  const response = await fetch(`${SALES_CRM}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function markAllSalesCrmNotificationsRead() {
  const response = await fetch(`${SALES_CRM}/notifications/read-all`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listAreaAssignments(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/area-assignments${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function assignAreaToSalesUser(payload) {
  const response = await fetch(`${SALES_CRM}/area-assignments`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function unassignAreaFromSalesUser(id) {
  const response = await fetch(`${SALES_CRM}/area-assignments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getAssignedInventory(userId) {
  const response = await fetch(`${SALES_CRM}/assigned-inventory/${userId}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listCommissionConfigs(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/commission-config${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function saveCommissionConfig(payload) {
  const response = await fetch(`${SALES_CRM}/commission-config`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function fetchCommissionReport(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/commission-report${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function fetchRevenueReport(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/revenue-report${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listSiteVisits(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/site-visits${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getSiteVisit(id) {
  const response = await fetch(`${SALES_CRM}/site-visits/${id}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listSiteVisitVehicleRequests() {
  const response = await fetch(`${SALES_CRM}/site-visits/vehicle-requests`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function approveSiteVisitVehicle(vehicleRequestId, payload) {
  const response = await fetch(`${SALES_CRM}/site-visits/vehicle-requests/${vehicleRequestId}/approve`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function rejectSiteVisitVehicle(vehicleRequestId, reason) {
  const response = await fetch(`${SALES_CRM}/site-visits/vehicle-requests/${vehicleRequestId}/reject`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
}

export async function updateSiteVisitStatus(id, status, notes) {
  const response = await fetch(`${SALES_CRM}/site-visits/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ status, notes }),
  });
  return parseResponse(response);
}

export const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'SITE_VISIT_SCHEDULED', label: 'Site Visit Scheduled' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const MEETING_STATUS_OPTIONS = [
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const MEETING_TYPE_OPTIONS = [
  { value: 'SITE_VISIT', label: 'Site Visit' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'OTHER', label: 'Other' },
];

export async function listVentureCatalog() {
  const response = await fetch(`${SALES_CRM}/ventures-catalog`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getLifecycleReports() {
  const response = await fetch(`${SALES_CRM}/lifecycle/reports`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function getLeadLifecycle(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/lifecycle/lead${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function listLifecycleFollowUps(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/lifecycle/follow-ups${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createLifecycleFollowUp(payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/follow-ups`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateLifecycleFollowUp(id, payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/follow-ups/${id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function completeLifecycleFollowUp(id, payload = {}) {
  const response = await fetch(`${SALES_CRM}/lifecycle/follow-ups/${id}/complete`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function rescheduleLifecycleFollowUp(id, payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/follow-ups/${id}/reschedule`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listLifecycleNegotiations(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/lifecycle/negotiations${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createLifecycleNegotiation(payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/negotiations`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateLifecycleNegotiation(id, payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/negotiations/${id}`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function listLifecycleDocuments(params = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${SALES_CRM}/lifecycle/documents${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

export async function createLifecycleDocument(payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/documents`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function completeLifecycleRegistration(payload) {
  const response = await fetch(`${SALES_CRM}/lifecycle/registration/complete`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

// Backward-compatible re-exports
export const getPartnerCrmDashboard = getSalesCrmDashboard;
export const getPartnerPerformance = getSalesPerformance;
export const assignPropertyToPartner = assignPropertyToSalesUser;
export const assignVentureToPartner = assignVentureToSalesUser;
export const listPartnerCustomers = listSalesCustomers;
export const createPartnerCustomer = createSalesCustomer;
export const assignCustomerToPartner = assignCustomerToSalesUser;
export const listPartnerLeads = listSalesLeads;
export const getPartnerLead = getSalesLead;
export const createPartnerLead = createSalesLead;
export const importPartnerLeads = importSalesLeads;
export const assignPartnerLead = assignSalesLead;
export const updatePartnerLead = updateSalesLead;
export const listPartnerFollowups = listSalesFollowups;
export const createPartnerFollowup = createSalesFollowup;
export const listPartnerMeetings = listSalesMeetings;
export const createPartnerMeeting = createSalesMeeting;
export const updatePartnerMeeting = updateSalesMeeting;
export const listPartnerCrmNotifications = listSalesCrmNotifications;
export const markPartnerCrmNotificationRead = markSalesCrmNotificationRead;
export const markAllPartnerCrmNotificationsRead = markAllSalesCrmNotificationsRead;
