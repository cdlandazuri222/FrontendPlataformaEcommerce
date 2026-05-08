import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // envía y recibe cookies HttpOnly del backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Helpers de sesión ────────────────────────────────────────────────────────

/** Limpia localStorage y todas las cookies de sesión, luego redirige al login. */
export const clearSession = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
  // Expira todas las cookies accesibles desde JS (las HttpOnly las borra el backend en /auth/logout)
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};



// ─── Interceptor de REQUEST: adjunta token ────────────────────────────────────
httpClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Interceptor de RESPONSE: maneja 401 ─────────────────────────────────────
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);


