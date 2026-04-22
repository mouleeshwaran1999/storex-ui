import axiosInstance from './axios';

export const getShop = () => axiosInstance.get('/shop').then((r) => r.data);
