import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/proxy',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});


