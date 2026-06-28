import axiosInstance from './axios';

export const getStores = () => axiosInstance.get('/admin/stores').then((r) => r.data);
export const createStore = (data) => axiosInstance.post('/admin/stores', data).then((r) => r.data);
export const updateStore = (id, data) => axiosInstance.put(`/admin/stores/${id}`, data).then((r) => r.data);
export const deleteStore = (id) => axiosInstance.delete(`/admin/stores/${id}`).then((r) => r.data);

export const getEmployees = () => axiosInstance.get('/admin/employees').then((r) => r.data);
export const createEmployee = (data) => axiosInstance.post('/admin/employees', data).then((r) => r.data);
export const updateEmployee = (id, data) => axiosInstance.put(`/admin/employees/${id}`, data).then((r) => r.data);
export const deleteEmployee = (id) => axiosInstance.delete(`/admin/employees/${id}`).then((r) => r.data);

export const getStoresPaged = (page = 1, limit = 25) =>
  axiosInstance.get('/admin/stores', { params: { page, limit } }).then((r) => {
    const b = r.data;
    return Array.isArray(b) ? { data: b, total: b.length, page, pages: Math.ceil(b.length / limit) || 1, limit } : b;
  });
export const getEmployeesPaged = (page = 1, limit = 25) =>
  axiosInstance.get('/admin/employees', { params: { page, limit } }).then((r) => {
    const b = r.data;
    return Array.isArray(b) ? { data: b, total: b.length, page, pages: Math.ceil(b.length / limit) || 1, limit } : b;
  });
