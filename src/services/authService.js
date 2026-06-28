import axiosInstance from './axios';

export const loginRequest = (identifier, password) =>
  axiosInstance.post('/auth/login', { identifier, password }).then((r) => r.data);

export const changePasswordRequest = (currentPassword, newPassword) =>
  axiosInstance.put('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data);

export const updateProfile = (data) =>
  axiosInstance.put('/auth/profile', data).then((r) => r.data);
