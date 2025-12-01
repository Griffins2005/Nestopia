import api from "./axiosConfig";

export const fetchStatsSummary = async () => {
  const response = await api.get("/stats/summary");
  return response.data;
};

