import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
    const hasSession = !!localStorage.getItem('token');

    if (status === 401 && !isLoginCall && hasSession) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
