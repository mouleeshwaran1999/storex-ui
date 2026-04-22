import axiosInstance from './axios';

export const getProducts = () => axiosInstance.get('/products').then((r) => r.data);
export const createProduct = (data) => axiosInstance.post('/products', data).then((r) => r.data);
export const updateProduct = (id, data) => axiosInstance.put(`/products/${id}`, data).then((r) => r.data);
export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`).then((r) => r.data);

export const adjustStock = (data) => axiosInstance.post('/stock/adjust', data).then((r) => r.data);

export const getBills = () => axiosInstance.get('/bills').then((r) => r.data);
export const createBill = (data) => axiosInstance.post('/bills', data).then((r) => r.data);
