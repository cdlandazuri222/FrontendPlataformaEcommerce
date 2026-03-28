import type { AuthClienteService, LoginCredentials, AuthClienteResult } from '@/domain/services/AuthClienteService';

export const loginCliente = async (
  authService: AuthClienteService,
  credentials: LoginCredentials,
): Promise<AuthClienteResult> => {
  return authService.login(credentials);
};
