  import { httpClient } from './httpClient';

  export type EstadoUsuario = 'INACTIVO' | 'INCOMPLETO' | 'COMPLETO';

  export interface CompletarPerfilDTO {
    nombre: string;
    apellido: string;
    tipoDocumento: string;
    documento: string;
    telefono: string;
  }

  export interface PrepararTransaccionDTO {
    idAsientoViaje: number;
    idPuntoOrigen: number;
    idPuntoDestino: number;
    idViaje: number;
    monto: number;
  }

  export interface DatosTransaccionWompi {
    referencia: string;
    amountInCents: number;
    currency: string;
    firma: string;
    publicKey: string;
    redirectUrl: string;
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
      console.log('[wompiApi] Llamando a /wompi/preparar-transaccion con:', datos);
      const response = await httpClient.post('/wompi/preparar-transaccion', datos);
      console.log('[wompiApi] Respuesta completa:', response);
      console.log('[wompiApi] response.data:', response.data);
      
      // El backend devuelve { success: true, referencia, amountInCents, ... }
      // Necesitamos extraer solo los datos de la transacción
      const { success, ...datosTransaccion } = response.data;
      console.log('[wompiApi] Datos de transacción extraídos:', datosTransaccion);
      
      return datosTransaccion as DatosTransaccionWompi;
    },
  };
