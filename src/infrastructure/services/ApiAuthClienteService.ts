import { httpClient } from '../api/httpClient';
import type {
  AuthClienteService,
  LoginCredentials,
  AuthClienteResult,
  RegistroCredentials,
} from '../../domain/services/AuthClienteService';

export class ApiAuthClienteService implements AuthClienteService {
  async login(credentials: LoginCredentials): Promise<AuthClienteResult> {
    const response = await httpClient.post('/auth/login/cliente', credentials);
    const payload = response.data.data || response.data;
    // El backend retorna { token, usuario } — mapeamos a { token, cliente }
    return {
      token: payload.token || payload.access_token,
      cliente: payload.usuario ?? payload.cliente,
    };
  }

  async loginGoogle(credencial: string): Promise<AuthClienteResult> {
    const response = await httpClient.post('/auth/loginGoogle/cliente', { credencial });
    const payload = response.data.data || response.data;
    return {
      token: payload.token || payload.access_token,
      cliente: payload.usuario ?? payload.cliente,
    };
  }

  async registrar(data: RegistroCredentials): Promise<void> {
    await httpClient.post('/auth/registrar/cliente', data);
  }

  async verificarEmail(token: string): Promise<{ message: string; result?: AuthClienteResult }> {
    const response = await httpClient.get(`/auth/verificar-email?token=${token}`);
    const resData = response.data;
    const payload = resData.data || resData;

    const authToken = payload.token || payload.access_token;
    const cliente = payload.usuario ?? payload.cliente;

    return {
      message: resData.message || 'Verificado de forma correcta.',
      result: (authToken && cliente) ? { token: authToken, cliente } : undefined,
    };
  }

  async reenviarVerificacion(correo: string): Promise<void> {
    await httpClient.post('/auth/reenviar-verificacion', { correo });
  }

  async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await httpClient.post('/auth/refresh-token');
    const payload = response.data.data || response.data;
    return { token: payload.token || payload.access_token };
  }
}
