import { httpClient } from '../api/httpClient';
import { cifrarPayloadRsa, cifrarPayloadAes, descifrarRespuesta } from '../../shared/utils/cryptoRsa';
import type {
  AuthClienteService,
  LoginCredentials,
  AuthClienteResult,
  RegistroCredentials,
} from '../../domain/services/AuthClienteService';

export class ApiAuthClienteService implements AuthClienteService {
  async login(credentials: LoginCredentials): Promise<AuthClienteResult> {
    const secureData = await cifrarPayloadRsa(credentials);
    const response = await httpClient.post('/auth/login/cliente', { data: secureData });
    let payload = response.data?.data || response.data;

    if (typeof payload === 'string' && payload.includes(':')) {
      const dec = await descifrarRespuesta<any>(payload);
      if (dec && typeof dec === 'object') {
        payload = dec;
      }
    }

    // El backend retorna { token, usuario } — mapeamos a { token, cliente }
    return {
      token: payload?.token || payload?.access_token || 'cookie-based-auth',
      cliente: payload?.usuario ?? payload?.cliente,
    };
  }

  async loginGoogle(credencial: string): Promise<AuthClienteResult> {
    const response = await httpClient.post('/auth/loginGoogle/cliente', { credencial });
    let payload = response.data?.data || response.data;

    if (typeof payload === 'string' && payload.includes(':')) {
      const dec = await descifrarRespuesta<any>(payload);
      if (dec && typeof dec === 'object') {
        payload = dec;
      }
    }

    return {
      token: payload?.token || payload?.access_token || 'cookie-based-auth',
      cliente: payload?.usuario ?? payload?.cliente,
    };
  }

  async registrar(data: RegistroCredentials): Promise<void> {
    // Se usa AES-256-GCM (no RSA-OAEP) porque el payload de registro tiene varios
    // campos y supera el límite de ~190 bytes que RSA-OAEP/2048+SHA-256 puede
    // cifrar en un solo bloque (causaba OperationError). El backend detecta el
    // formato AES (ivHex:cipherHex) por el ':' y lo descifra correctamente.
    const secureData = await cifrarPayloadAes(data);
    await httpClient.post('/auth/registrar/cliente', { data: secureData });
  }

  async verificarEmail(token: string): Promise<{ message: string; result?: AuthClienteResult }> {
    const response = await httpClient.post('/auth/verificar-email', { token });
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
    const payload = response.data?.data || response.data;
    return { token: payload?.token || payload?.access_token };
  }

  async olvidoPassword(correo: string): Promise<void> {
    await httpClient.post('/auth/olvide-password', { correo });
  }

  async restablecerPassword(token: string, password: string): Promise<void> {
    const secureData = await cifrarPayloadRsa({ token, password });
    await httpClient.post('/auth/restablecer-password', { data: secureData });
  }
}

