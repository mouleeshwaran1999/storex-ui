import axiosInstance from './axios';

export const getProducts = () => axiosInstance.get('/products').then((r) => r.data);
export const createProduct = (data) => axiosInstance.post('/products', data).then((r) => r.data);
export const updateProduct = (id, data) => axiosInstance.put(`/products/${id}`, data).then((r) => r.data);
export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`).then((r) => r.data);

export const adjustStock = (data) => axiosInstance.post('/stock/adjust', data).then((r) => r.data);

export const getBills = () => axiosInstance.get('/bills').then((r) => r.data);
export const createBill = (data) => axiosInstance.post('/bills', data).then((r) => r.data);
export const payBill = (id, data) => axiosInstance.put(`/bills/${id}/pay`, data).then((r) => r.data);

export const getCustomers = () => axiosInstance.get('/customers').then((r) => r.data);
export const createCustomer = (data) => axiosInstance.post('/customers', data).then((r) => r.data);
export const updateCustomer = (id, data) => axiosInstance.put(`/customers/${id}`, data).then((r) => r.data);
export const deleteCustomer = (id) => axiosInstance.delete(`/customers/${id}`).then((r) => r.data);

export const getProductsPaged = (page = 1, limit = 25) =>
  axiosInstance.get('/products', { params: { page, limit } }).then((r) => {
    const b = r.data;
    return Array.isArray(b) ? { data: b, total: b.length, page, pages: Math.ceil(b.length / limit) || 1, limit } : b;
  });
export const getBillsPaged = (page = 1, limit = 25) =>
  axiosInstance.get('/bills', { params: { page, limit } }).then((r) => {
    const b = r.data;
    return Array.isArray(b) ? { data: b, total: b.length, page, pages: Math.ceil(b.length / limit) || 1, limit } : b;
  });
