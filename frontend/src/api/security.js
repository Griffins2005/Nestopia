import api from './axiosConfig';
import endpoints from './endpoints';

export function getSecurityStatus() {
  return api.get(endpoints.security.status);
}

export function setupTotp() {
  return api.post(endpoints.security.totpSetup);
}

export function confirmTotp(code) {
  return api.post(endpoints.security.totpConfirm, { code });
}

export function disableTotp(password, code) {
  return api.post(endpoints.security.totpDisable, { password, code });
}
