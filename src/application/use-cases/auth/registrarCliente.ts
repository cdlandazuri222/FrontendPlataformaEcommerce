import type { AuthClienteService, RegistroCredentials } from '@/domain/services/AuthClienteService';

export const registrarCliente = async (
  authService: AuthClienteService,
  data: RegistroCredentials,
): Promise<void> => {
  return authService.registrar(data);
};
