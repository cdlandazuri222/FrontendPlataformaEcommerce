import type { Cliente } from '../entities/Cliente';

export interface RegistroCredentials {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  direccion: string;
}

export interface LoginCredentials {
  correo: string;
  password: string;
}

export interface AuthClienteResult {
  cliente: Cliente;
  token: string;
}

export interface AuthClienteService {
  login(credentials: LoginCredentials): Promise<AuthClienteResult>;
  loginGoogle(credencial: string): Promise<AuthClienteResult>;
  registrar(data: RegistroCredentials): Promise<void>;
  verificarEmail(token: string): Promise<{ message: string; result?: AuthClienteResult }>;
  reenviarVerificacion(correo: string): Promise<void>;
  logout(): Promise<void>;
  /** Solicita un nuevo token al backend usando el token actual (aún válido). */
  refreshToken(): Promise<{ token: string }>;
}
