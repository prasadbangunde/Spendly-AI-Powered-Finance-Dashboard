import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('spendly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('spendly_token');
      localStorage.removeItem('spendly_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
