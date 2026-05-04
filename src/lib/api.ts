import axios from 'axios';

// Usamos el proxy de Vite relativo en desarrollo y producción
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Eliminado: interceptor que inyecta el token JWT desde localStorage.
// Al delegar en las cookies (Session), no debemos mezclar ambas cosas.
api.interceptors.request.use((config) => {
  return config;
});

// Interceptor para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirigir al login si la sesión caducó
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
