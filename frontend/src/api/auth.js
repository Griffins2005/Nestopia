import api from './axiosConfig';
import endpoints from './endpoints';

export function login(email, password, role) {
  return api.post(endpoints.auth.login, { email, password, role });
}

export function signup(email, password, role, name) {
  return api.post(endpoints.auth.signup, { email, password, role, name: name || undefined });
}

export function verify2fa(challengeToken, code) {
  return api.post(endpoints.auth.verify2fa, { challenge_token: challengeToken, code });
}

export function logout() {
  return api.post(endpoints.auth.logout);
}

export function requestPasswordReset(email, role) {
  return api.post(endpoints.auth.passwordResetRequest, { email, role });
}

export function confirmPasswordReset(token, newPassword, confirmPassword) {
  return api.post(endpoints.auth.passwordResetConfirm, {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'lower', label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Number', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Symbol (!@#$…)', test: (p) => /[^\w\s]/.test(p) },
];

export function passwordStrengthScore(password) {
  if (!password) return 0;
  return PASSWORD_RULES.filter((r) => r.test(password)).length;
}

export function isStrongPassword(password) {
  return passwordStrengthScore(password) === PASSWORD_RULES.length;
}

export { PASSWORD_RULES };
