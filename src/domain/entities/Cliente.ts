export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  direccion: string;
  activo: boolean;
  fotoperfil?: string;
  proveedor?: string;
  roles?: string[];
  rolActivo?: string;
  estadousuario?: string;
}
