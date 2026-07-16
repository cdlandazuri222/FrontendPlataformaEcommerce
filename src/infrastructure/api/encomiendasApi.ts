import { httpClient } from './httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OficinaEncomiendaAPI {
  idoficinaencomienda: number;
  direccion: string;
  telefono: string;
  idciudad: number;
  nombreciudad: string;
}

export interface CotizarEncomiendaDTO {
  idOficinaOrigen: number;
  idOficinaDestino: number;
  pesoEstimado: number;
  volumenEstimado?: number;
  valorDeclarado?: number;
  esDomicilio?: boolean;
  valorDomicilio?: number;
}

export interface CrearPreinscripcionDTO {
  idOficinaOrigen: number;
  idOficinaDestino: number;
  nombreDestinatario: string;
  documentoDestinatario: string;
  telefonoDestinatario: string;
  contenidoDeclarado: string;
  pesoEstimado: number;
  volumenEstimado?: number;
  /** Opcional: si no se declara, el backend aplica el seguro mínimo configurado. */
  valorDeclarado?: number;
  direccionDestinatario?: string;
  esDomicilio?: boolean;
  valorDomicilio?: number;
}

export interface EncomiendaAPI {
  idencomienda: number;
  referenciaencomienda: string;
  estado: string;
  [key: string]: unknown;
}

export interface PreinscripcionResultadoAPI {
  encomienda: EncomiendaAPI;
  referencia: string;
  qrBase64: string;
  cotizacion: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const encomiendasApi = {
  /** Lista de oficinas de encomiendas activas para los comboboxes de origen/destino. */
  async getOficinasSelect(): Promise<OficinaEncomiendaAPI[]> {
    const response = await httpClient.get<{ data: { oficinasEncomiendas: OficinaEncomiendaAPI[] } }>(
      '/oficinas-encomiendas/select'
    );
    return response.data.data.oficinasEncomiendas;
  },

  /** Calcula la cotización estimada sin persistir ningún registro. */
  async cotizar(datos: CotizarEncomiendaDTO): Promise<number> {
    const response = await httpClient.post<{ data: { cotizacion: number } }>(
      '/encomiendas/cotizar',
      datos
    );
    return response.data.data.cotizacion;
  },

  /** Crea la preinscripción de la encomienda (referencia + QR + cotización). */
  async crearPreinscripcion(datos: CrearPreinscripcionDTO): Promise<PreinscripcionResultadoAPI> {
    const response = await httpClient.post<{ data: PreinscripcionResultadoAPI }>(
      '/encomiendas/preinscripcion',
      datos
    );
    return response.data.data;
  },
};
