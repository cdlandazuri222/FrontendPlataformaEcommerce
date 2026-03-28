export interface ClienteDTO {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  direccion: string;
  activo: boolean;
}

export interface RegistroClienteDTO {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  direccion: string;
}

export interface LoginClienteDTO {
  correo: string;
  password: string;
}
