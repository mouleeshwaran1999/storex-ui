import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://storex-api-2ft5.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor: attach JWT from localStorage to every request.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 for an *authenticated* request (i.e. an
// expired/invalid token on something other than the login endpoint),
// clear the session and redirect to /login. A 401 returned by the
// login endpoint itself just bubbles up so the form can show the error.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isLoginCall = url.includes('/auth/login');
    const isChangePw  = url.includes('/auth/change-password');
    const isProfile   = url.includes('/auth/profile');
    const hasSession = !!localStorage.getItem('token');

    if (status === 401 && !isLoginCall && !isChangePw && !isProfile && hasSession) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
