import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  registrarCliente: async (userData) => {
    const response = await api.post('/auth/registrar/cliente', userData);
    return response.data;
  },

  loginCliente: async (correo, password) => {
    const response = await api.post('/auth/login/cliente', { correo, password });
    return response.data;
  },

  loginGoogle: async (credencial) => {
    const response = await api.post('/auth/loginGoogle/cliente', { credencial });
    return response.data;
  },

  verificarEmail: async (token) => {
    console.log('API Service - verificarEmail called with token:', token?.substring(0, 20) + '...');
    const url = `/auth/verificar-email?token=${token}`;
    console.log('Full URL:', API_URL + url);
    const response = await api.get(url);
    console.log('API Response:', response.data);
    return response.data;
  },

  reenviarVerificacion: async (correo) => {
    const response = await api.post('/auth/reenviar-verificacion', { correo });
    return response.data;
  },
};

export default api;
