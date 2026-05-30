import api from './axiosConfig';
import endpoints from './endpoints';

export function getTokenBalance() {
  return api.get(endpoints.tokens.balance);
}

export function spendTokens(amount, reason) {
  return api.post(endpoints.tokens.spend, null, {
    params: { amount, reason },
  });
}
