import { httpClient } from './httpClient';

export type EstadoUsuario = 'INACTIVO' | 'INCOMPLETO' | 'COMPLETO';

export interface CompletarPerfilDTO {
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
}

export interface AsientoTransaccionDTO {
  idAsientoViaje: number;
  idPuntoOrigen: number;
  idPuntoDestino: number;
  monto: number;
  esComprador: boolean;
  nombrePasajero: string;
  apellidoPasajero: string;
  tipoDocumento: string;
  documento: string;
  telefono?: string;
  correoPasajero?: string;
}

export interface PrepararTransaccionDTO {
  idViaje: number;
  asientos: AsientoTransaccionDTO[];
}

export interface DatosTransaccionWompi {
  referencia: string;
  amountInCents: number;
  currency: string;
  firma: string;
  publicKey: string;
  redirectUrl: string;
}

export interface PasajeroSugerencia {
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  correo: string;
}

export interface TiqueteReferencia {
  idTiquete: number;
  codigoTiquete: string;
  tienePdf: boolean;
  numeroAsiento: number;
}

export const wompiApi = {
  obtenerEstadoCliente: async (): Promise<{ estadousuario: EstadoUsuario }> => {
    const { data } = await httpClient.get('/wompi/estado-cliente');
    return data;
  },

  completarPerfil: async (datos: CompletarPerfilDTO): Promise<void> => {
    await httpClient.put('/wompi/completar-perfil', datos);
  },

  prepararTransaccion: async (datos: PrepararTransaccionDTO): Promise<DatosTransaccionWompi> => {
    const response = await httpClient.post('/wompi/preparar-transaccion', datos);
    const { success, ...datosTransaccion } = response.data;
    return datosTransaccion as DatosTransaccionWompi;
  },

  buscarPasajeros: async (documento: string): Promise<PasajeroSugerencia[]> => {
    const { data } = await httpClient.get('/wompi/pasajeros/buscar', {
      params: { documento },
    });
    return data.pasajeros || [];
  },

  obtenerTiquetesPorReferencia: async (referencia: string): Promise<TiqueteReferencia[]> => {
    const { data } = await httpClient.get(`/wompi/tiquetes/por-referencia/${referencia}`);
    return data.tiquetes || [];
  },
};
