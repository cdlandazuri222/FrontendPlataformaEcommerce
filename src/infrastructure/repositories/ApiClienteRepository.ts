import { httpClient } from '../api/httpClient';
import type { ClienteRepository } from '../../domain/repositories/ClienteRepository';
import type { Cliente } from '../../domain/entities/Cliente';

export class ApiClienteRepository implements ClienteRepository {
  async findById(id: string): Promise<Cliente | null> {
    const response = await httpClient.get(`/clientes/${id}`);
    return response.data.data ?? null;
  }

  async save(data: Omit<Cliente, 'id' | 'activo'>): Promise<Cliente> {
    const response = await httpClient.post('/clientes', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const response = await httpClient.put(`/clientes/${id}`, data);
    return response.data.data;
  }
}
