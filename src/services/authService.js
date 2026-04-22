import axiosInstance from './axios';

export const loginRequest = (identifier, password) =>
  axiosInstance.post('/auth/login', { identifier, password }).then((r) => r.data);
