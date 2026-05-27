import axiosInstance from './axios';

const toParams = (range = {}) => {
  const params = {};
  if (range.start) params.start = range.start;
  if (range.end) params.end = range.end;
  return params;
};

// Employee — own store
export const getMyReport = (range) =>
  axiosInstance.get('/report', { params: toParams(range) }).then(r => r.data);

// Admin — any owned store
export const getStoreReport = (storeId, range) =>
  axiosInstance.get(`/admin/stores/${storeId}/report`, { params: toParams(range) }).then(r => r.data);
