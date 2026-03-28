import type { AuthClienteService } from '@/domain/services/AuthClienteService';

export const logoutCliente = async (authService: AuthClienteService): Promise<void> => {
  return authService.logout();
};
