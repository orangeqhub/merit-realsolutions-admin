import { API_BASE_URL } from '../../config/api.js';
import { getAuthToken } from '../auth/authStorage.js';

const API_V1 = `${API_BASE_URL}/v1`;

function authHeaders(json = false) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required.');
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data.data;
}

export async function listPendingPayments(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/payments/pending?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listPayments(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/payments?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function listReceipts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_V1}/admin/payments/receipts?${query}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function getPaymentDetail(id) {
  const response = await fetch(`${API_V1}/admin/payments/${id}`, {
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function approvePayment(id, remarks = '') {
  const response = await fetch(`${API_V1}/admin/payments/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ remarks }),
  });
  return parseResponse(response);
}

export async function rejectPayment(id, remarks = '') {
  const response = await fetch(`${API_V1}/admin/payments/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ remarks }),
  });
  return parseResponse(response);
}

export async function extendReservation(bookingId, days = 7) {
  const response = await fetch(`${API_V1}/admin/bookings/${bookingId}/extend-reservation`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ days }),
  });
  return parseResponse(response);
}

export async function cancelBooking(bookingId, reason = '') {
  const response = await fetch(`${API_V1}/admin/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
}

export async function markRegistrationPending(bookingId) {
  const response = await fetch(`${API_V1}/admin/bookings/${bookingId}/registration-pending`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function markBookingCompleted(bookingId) {
  const response = await fetch(`${API_V1}/admin/bookings/${bookingId}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseResponse(response);
}

export async function downloadPaymentReceipt(paymentId, format = 'text') {
  const query = format === 'html' ? '?format=html' : '';
  const response = await fetch(`${API_V1}/admin/payments/${paymentId}/receipt${query}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Unable to download receipt.');
  }
  const text = await response.text();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  return {
    text,
    filename: match?.[1] || `payment-${paymentId}-receipt.${format === 'html' ? 'html' : 'txt'}`,
    contentType: format === 'html' ? 'text/html' : 'text/plain',
  };
}

export async function printPaymentReceipt(paymentId) {
  const { text, contentType } = await downloadPaymentReceipt(paymentId, 'html');
  const blob = new Blob([text], { type: contentType });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) {
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
