import type { AuthClienteService, AuthClienteResult } from '@/domain/services/AuthClienteService';

export const verificarEmail = async (
  authService: AuthClienteService,
  token: string,
): Promise<{ message: string; result?: AuthClienteResult }> => {
  return authService.verificarEmail(token);
};
