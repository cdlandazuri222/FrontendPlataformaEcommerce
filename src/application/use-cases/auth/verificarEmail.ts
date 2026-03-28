import type { AuthClienteService } from '@/domain/services/AuthClienteService';

export const verificarEmail = async (
  authService: AuthClienteService,
  token: string,
): Promise<string> => {
  return authService.verificarEmail(token);
};
