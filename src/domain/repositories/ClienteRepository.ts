import type { Cliente } from '../entities/Cliente';

export interface ClienteRepository {
  findById(id: string): Promise<Cliente | null>;
  save(data: Omit<Cliente, 'id' | 'activo'>): Promise<Cliente>;
  update(id: string, data: Partial<Cliente>): Promise<Cliente>;
}
