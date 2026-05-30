import api from './axiosConfig';
import endpoints from './endpoints';

export function initiatePayment(payload) {
  return api.post(endpoints.payments.initiate, payload);
}

export function listPayments() {
  return api.get(endpoints.payments.list);
}

export function getPayment(paymentId) {
  return api.get(endpoints.payments.detail(paymentId));
}

export function confirmPayment(payload) {
  return api.post(endpoints.payments.confirm, payload);
}
