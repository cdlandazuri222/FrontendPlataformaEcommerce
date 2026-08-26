import axios from 'axios';
import { descifrarDataRecursivo } from '../../shared/utils/cryptoRsa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // envía y recibe cookies HttpOnly del backend
  headers: {
    'Content-Type': 'application/json',
  },
});


export const clearSession = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};



// ─── Interceptor de REQUEST: adjunta token ────────────────────────────────────
httpClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken');
  
  // Lista de endpoints públicos que NO deben incluir el token
  const publicEndpoints = [
    '/auth/login',
    '/auth/registrar',
    '/auth/verificar-email',
    '/auth/olvide-password',
    '/auth/restablecer-password',
    '/auth/reenviar-verificacion',
    '/auth/loginGoogle',
  ];
  
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

  console.log('[httpClient] Request:', config.method?.toUpperCase(), config.url, 'isPublic:', isPublicEndpoint);

  if (token && !isPublicEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Interceptor de RESPONSE: descifrado automático y maneja 401 ────────────
httpClient.interceptors.response.use(
  async (response) => {
    if (response.data) {
      response.data = await descifrarDataRecursivo(response.data);
    }
    console.log('[httpClient] Response:', response.status, response.config?.url);
    return response;
  },
  async (error) => {

    console.log('[httpClient] Error:', error.response?.status, error.config?.url);
    if (error.response?.status === 401) {
      // No redirigir si estamos en la página de nueva contraseña o si es una llamada a restablecer-password
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || '';
      
      console.log('[401 Interceptor] Path:', currentPath, 'URL:', requestUrl);
      
      if (!currentPath.includes('/nueva-password') && !requestUrl.includes('restablecer-password')) {
        console.log('[401 Interceptor] Redirecting to login');
        clearSession();
        window.location.href = '/login';
      } else {
        console.log('[401 Interceptor] Skipping redirect (on nueva-password page)');
      }
    }
    
    return Promise.reject(error);
  }
);


