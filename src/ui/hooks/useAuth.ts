import { useState } from 'react';
import { ApiAuthClienteService } from '../../infrastructure/services/ApiAuthClienteService';
import { loginCliente } from '../../application/use-cases/auth/loginCliente';
import { loginClienteGoogle } from '../../application/use-cases/auth/loginClienteGoogle';
import { registrarCliente } from '../../application/use-cases/auth/registrarCliente';
import { logoutCliente } from '../../application/use-cases/auth/logoutCliente';
import { verificarEmail } from '../../application/use-cases/auth/verificarEmail';
import { clearSession } from '../../infrastructure/api/httpClient';
import type { LoginCredentials, RegistroCredentials } from '../../domain/services/AuthClienteService';
import type { Cliente } from '../../domain/entities/Cliente';

const authService = new ApiAuthClienteService();

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getUsuario = (): Cliente | null => {
    const stored = localStorage.getItem('usuario');
    // Blindaje: si el valor no existe o quedó corrupto (p. ej. el string "undefined"
    // o "null" guardado por un JSON.stringify de un valor inválido), no reventar el
    // render. Se limpia la entrada corrupta y se devuelve null.
    if (!stored || stored === 'undefined' || stored === 'null') {
      if (stored) localStorage.removeItem('usuario');
      return null;
    }
    try {
      return JSON.parse(stored) as Cliente;
    } catch {
      localStorage.removeItem('usuario');
      return null;
    }
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginCliente(authService, credentials);
      if (!result?.cliente) {
        throw new Error('No se recibió la información del usuario. Intenta de nuevo.');
      }
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
      if (!result?.cliente) {
        throw new Error('No se recibió la información del usuario. Intenta de nuevo.');
      }
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
      // Limpia localStorage + cookies de sesión accesibles desde JS
      clearSession();
    }
  };

  const handleVerificarEmail = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await verificarEmail(authService, token);
      if (res.result?.cliente) {
        localStorage.setItem('usuario', JSON.stringify(res.result.cliente));
        if (res.result.token) localStorage.setItem('authToken', res.result.token);
      }
      return res.message;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Error al verificar el correo';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleOlvidoPassword = async (correo: string) => {
    setLoading(true);
    setError('');
    try {
      await authService.olvidoPassword(correo);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Error al procesar la solicitud';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRestablecerPassword = async (token: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      await authService.restablecerPassword(token, password);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Error al restablecer la contraseña';
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
    olvidoPassword: handleOlvidoPassword,
    restablecerPassword: handleRestablecerPassword,
  };
};
