import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API = `${API_BASE_URL}/v1/admin/finance`;

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
    throw new Error(data.message || 'Request failed.');
  }
  return data.data;
}

function buildQuery(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  return new URLSearchParams(clean).toString();
}

async function get(path, params) {
  const query = buildQuery(params);
  const response = await fetch(`${API}${path}${query ? `?${query}` : ''}`, { headers: authHeaders() });
  return parseResponse(response);
}

async function send(path, method, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: authHeaders(true),
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse(response);
}

export const fetchFinanceDashboard = () => get('/dashboard');
export const fetchFinanceTracker = (params) => get('/tracker', params);
export const fetchFinanceReports = (params) => get('/reports', params);
export const runFinanceReminders = () => send('/reminders/run', 'POST', {});

export const listRegistrations = (params) => get('/registrations', params);
export const getRegistration = (id) => get(`/registrations/${id}`);
export const createRegistration = (payload) => send('/registrations', 'POST', payload);
export const scheduleRegistration = (id, payload) => send(`/registrations/${id}/schedule`, 'POST', payload);
export const assignRegistrationExecutive = (id, executiveUserId) => send(`/registrations/${id}/assign-executive`, 'POST', { executiveUserId });
export const updateRegistrationStatus = (id, status, remarks) => send(`/registrations/${id}/status`, 'PATCH', { status, remarks });
export const markRegistrationRegistered = (id, payload) => send(`/registrations/${id}/mark-registered`, 'POST', payload || {});
export const markRegistrationSold = (id, payload) => send(`/registrations/${id}/mark-sold`, 'POST', payload || {});
export const uploadRegistrationDocument = (id, payload) => send(`/registrations/${id}/documents`, 'POST', payload);

export const fetchLedger = (bookingId) => get(`/ledgers/${bookingId}`);
export const listInstallments = (params) => get('/installments', params);
export const recordInstallmentPayment = (id, payload) => send(`/installments/${id}/pay`, 'POST', payload);
export const editInstallment = (id, payload) => send(`/installments/${id}`, 'PATCH', payload);

export async function fetchReceipt(paymentId, format = 'json') {
  if (format === 'html') {
    const response = await fetch(`${API}/receipts/${paymentId}?format=html`, { headers: authHeaders() });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to load receipt.');
    }
    return { html: await response.text() };
  }
  return get(`/receipts/${paymentId}`);
}

export async function exportFinanceReport(type = 'collections', format = 'csv') {
  const query = buildQuery({ type, format });
  const response = await fetch(`${API}/reports/export?${query}`, { headers: authHeaders() });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Export failed.');
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return { blob, filename: match?.[1] || `finance-${type}.${format === 'pdf' ? 'html' : 'csv'}` };
}

export const REGISTRATION_STATUSES = [
  'PENDING',
  'DOCUMENTS_PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'REGISTERED',
  'COMPLETED',
  'CANCELLED',
];

export const REGISTRATION_STATUS_LABELS = {
  PENDING: 'Pending',
  DOCUMENTS_PENDING: 'Documents Pending',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  REGISTERED: 'Registered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
