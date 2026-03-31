import { useState } from 'react';
import { ApiAuthClienteService } from '../../infrastructure/services/ApiAuthClienteService';
import { loginCliente } from '../../application/use-cases/auth/loginCliente';
import { loginClienteGoogle } from '../../application/use-cases/auth/loginClienteGoogle';
import { registrarCliente } from '../../application/use-cases/auth/registrarCliente';
import { logoutCliente } from '../../application/use-cases/auth/logoutCliente';
import { verificarEmail } from '../../application/use-cases/auth/verificarEmail';
import type { LoginCredentials, RegistroCredentials } from '../../domain/services/AuthClienteService';
import type { Cliente } from '../../domain/entities/Cliente';

const authService = new ApiAuthClienteService();

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getUsuario = (): Cliente | null => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginCliente(authService, credentials);
      localStorage.setItem('usuario', JSON.stringify(result.cliente));
      if (result.token) localStorage.setItem('authToken', result.token);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; data?: { message?: string } } } };
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.data?.message || 'Correo o contraseña incorrectos';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginGoogle = async (credencial: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginClienteGoogle(authService, credencial);
      localStorage.setItem('usuario', JSON.stringify(result.cliente));
      if (result.token) localStorage.setItem('authToken', result.token);
      return result;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Error al iniciar sesión con Google';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (data: RegistroCredentials) => {
    setLoading(true);
    setError('');
    try {
      await registrarCliente(authService, data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Error al registrar usuario';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCliente(authService);
    } finally {
      localStorage.removeItem('usuario');
      localStorage.removeItem('authToken');
    }
  };

  const handleVerificarEmail = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      return await verificarEmail(authService, token);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Error al verificar el correo';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    getUsuario,
    login: handleLogin,
    loginGoogle: handleLoginGoogle,
    registro: handleRegistro,
    logout: handleLogout,
    verificarEmail: handleVerificarEmail,
  };
};
