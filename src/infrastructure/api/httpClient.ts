import axios from 'axios';
import { isTokenValid, shouldRefreshToken } from '../../shared/utils/tokenUtils';

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

// ─── Flag para evitar múltiples refreshes simultáneos ────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshSuccess = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

// ─── Interceptor de REQUEST: adjunta token y dispara refresh proactivo ────────
httpClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken');

  // Si el token ya expiró, limpiar sesión antes de continuar
  if (token && !isTokenValid(token)) {
    clearSession();
    window.location.href = '/login';
    return Promise.reject(new Error('Token expirado'));
  }

  // Refresh proactivo: si el token está próximo a expirar, renovarlo antes de la petición
  if (token && shouldRefreshToken(token) && !isRefreshing) {
    isRefreshing = true;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
      );
      const payload = response.data.data || response.data;
      const newToken: string = payload.token || payload.access_token;
      localStorage.setItem('authToken', newToken);
      onRefreshSuccess(newToken);
      config.headers.Authorization = `Bearer ${newToken}`;
    } catch {
      // Si el refresh falla, cerrar sesión
      clearSession();
      window.location.href = '/login';
      return Promise.reject(new Error('No se pudo renovar el token'));
    } finally {
      isRefreshing = false;
    }
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Interceptor de RESPONSE: maneja 401 con reintento tras refresh ───────────
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('authToken')
    ) {
      // Marcar para no reintentar infinitamente
      originalRequest._retry = true;

      if (isRefreshing) {
        // Esperar a que el refresh en curso termine
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(httpClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
        );
        const payload = response.data.data || response.data;
        const newToken: string = payload.token || payload.access_token;
        localStorage.setItem('authToken', newToken);
        onRefreshSuccess(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(originalRequest);
      } catch {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
