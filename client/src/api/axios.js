import axios from 'axios';

export const STORAGE_KEY = 'jobtracker_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`;
  } catch {
    /* storage unavailable or corrupted: send the request without a token */
  }
  return config;
});

// If the token is rejected on a protected call, log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthCall) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Turn any axios error into a readable message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Cannot reach the server. Is it running?';
  return 'Something went wrong. Please try again.';
};

export default api;
