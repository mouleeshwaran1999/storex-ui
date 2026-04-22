import axiosInstance from './axios';

export const getAdmins = () => axiosInstance.get('/super-admin/admins').then((r) => r.data);
export const createAdmin = (data) => axiosInstance.post('/super-admin/admins', data).then((r) => r.data);
export const updateAdmin = (id, data) => axiosInstance.put(`/super-admin/admins/${id}`, data).then((r) => r.data);
export const deleteAdmin = (id) => axiosInstance.delete(`/super-admin/admins/${id}`).then((r) => r.data);
