import { httpClient } from './httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViajesQuery {
  page?: number;
  limit?: number;
  origen?: string;
  destino?: string;
  destinoTipo?: 'ciudad' | 'punto';
  fecha?: string;
  soloHoy?: boolean;
  soloProgramados?: boolean;
}

export interface Paginacion {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
}

export interface ViajeAPI {
  idviaje: number;
  codigoviaje: string;
  fechasalida: string;
  horasalida: string;
  ruta: {
    idruta: number;
    nombre: string;
    via: string;
    origen: string;
    destino: string;
  };
  vehiculo: {
    idvehiculo: number;
    numeromovil: string;
    placa: string;
    tipobus: string;
    capacidad: number;
  };
  asientos: {
    total: number;
    libres: number;
    reservados: number;
    vendidos: number;
  };
  precio: {
    valor: number;
    tipoTarifa: 'NORMAL' | 'TRAFICO_ALTO';
    tramo: {
      origen: string;
      destino: string;
    };
  };
  imagenDestino?: string;
  tramoBuscado?: { origen: string; destino: string; idPuntoOrigen?: number | null; idPuntoDestino?: number | null };
}

export interface ViajesResponse {
  viajesHoy: ViajeAPI[];
  viajesProgramados: ViajeAPI[];
  totalHoy: number;
  totalProgramados: number;
  paginacion: Paginacion;
}

export interface CiudadOrigen {
  idciudad: number;
  nombre: string;
  urlimagenciudad?: string;
  agencias: { idagencia: number; nombre: string }[];
}

export interface OpcionDestino {
  id: number;
  nombre: string;
  tipo: 'ciudad' | 'punto';
  urlimagenciudad?: string;
  idciudad?: number;
}

export interface MiViaje {
  idtiquete: number;
  codigotiquete: string | null;
  valorcobrado: number;
  urlpdf: string | null;
  tienePdf: boolean;
  fechasalida: string;
  horasalida: string;
  origennombre: string;
  destinonombre: string;
  placa: string;
  numeromovil: string;
  tipobus: string;
  numeroasiento: number;
  referencia: string;
  estado: 'Próximo' | 'Completado';
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status?: number }; code?: string };
    const isNetworkError = !axiosErr.response || axiosErr.code === 'NETWORK_ERROR';
    const isServerError = (axiosErr.response?.status ?? 0) >= 500;

    if (retries > 0 && (isNetworkError || isServerError)) {
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

// ─── API functions ────────────────────────────────────────────────────────────

export const plataformaEcommerceApi = {
  /**
   * Obtiene viajes para el Home con clasificación hoy/programados.
   * Endpoints públicos — no requieren token.
   */
  async getViajes(params: ViajesQuery = {}): Promise<ViajesResponse> {
    return withRetry(async () => {
      const response = await httpClient.get<{ data: ViajesResponse }>(
        '/plataforma-ecommerce/viajes',
        { params }
      );
      return response.data.data;
    });
  },

  /** Ciudades disponibles como origen (solo las que tienen agencia). */
  async getCiudadesOrigen(): Promise<CiudadOrigen[]> {
    return withRetry(async () => {
      const response = await httpClient.get<{ data: CiudadOrigen[] }>(
        '/plataforma-ecommerce/ciudades-origen'
      );
      return response.data.data;
    });
  },

  /** Opciones de destino: ciudades con agencia + puntos intermedios de rutas. */
  async getCiudadesDestino(origenId?: number): Promise<OpcionDestino[]> {
    return withRetry(async () => {
      const response = await httpClient.get<{ data: OpcionDestino[] }>(
        '/plataforma-ecommerce/ciudades-destino',
        { params: origenId ? { origen: origenId } : undefined }
      );
      return response.data.data;
    });
  },

  /** Tiquetes del usuario autenticado para "Mis Viajes". */
  async getMisViajes(): Promise<MiViaje[]> {
    const response = await httpClient.get<{ data: MiViaje[] }>(
      '/plataforma-ecommerce/mis-viajes'
    );
    return response.data.data;
  },
};
