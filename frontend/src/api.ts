/// <reference types="vite/client" />
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://3.37.130.204:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 요청 시 JWT 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api; 