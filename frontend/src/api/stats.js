import api from './axiosConfig';
import endpoints from './endpoints';

export const fetchStatsSummary = async () => {
  const response = await api.get(endpoints.stats.summary);
  return response.data;
};
