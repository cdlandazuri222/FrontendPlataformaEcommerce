import type { AuthClienteService, AuthClienteResult } from '@/domain/services/AuthClienteService';

export const loginClienteGoogle = async (
  authService: AuthClienteService,
  credencial: string,
): Promise<AuthClienteResult> => {
  return authService.loginGoogle(credencial);
};
