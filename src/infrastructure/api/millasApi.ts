import { httpClient } from './httpClient';

export interface UsuarioMillasInfo {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  documento?: string;
  numeroSocio: string;
}

export interface NivelInfo {
  id: string;
  nombre: string;
  multiplicador: number;
  descuentoTiquetes: string;
  color: string;
  badgeBg: string;
  beneficios: string[];
}

export interface SiguienteNivelInfo {
  id: string;
  nombre: string;
  minMillas: number;
  millasFaltantes: number;
  progreso: number;
}

export interface EstadisticasMillas {
  totalViajes: number;
  millasPorViajes: number;
  bonoBienvenida: number;
  millasAcumuladasTotal: number;
  millasCanjeadas: number;
  ahorroTotalCop: number;
}

export interface MillasResumen {
  usuario: UsuarioMillasInfo;
  saldoMillas: number;
  valorEquivalenteCop: number;
  nivel: NivelInfo;
  siguienteNivel: SiguienteNivelInfo | null;
  estadisticas: EstadisticasMillas;
}

export interface MovimientoMilla {
  id: string;
  tipo: 'ACUMULACION' | 'CANJE';
  concepto: string;
  descripcion: string;
  millas: number;
  fecha: string;
  icono: string;
  categoria: string;
}

export interface NivelBeneficio {
  id: string;
  nombre: string;
  minMillas: number;
  maxMillas: number;
  color: string;
  badgeBg: string;
  multiplicador: number;
  descuentoTiquetes: string;
  beneficios: string[];
}

export interface EstimadoMillas {
  montoCop: number;
  millasBase: number;
  porcentajeRetorno: string;
  equivalenciaDescuentoCop: number;
  nivelesEstimados: Array<{
    nivel: string;
    multiplicador: number;
    millasConMultiplicador: number;
    descuentoFuturoCop: number;
  }>;
}

/** Recompensa del catálogo configurado por el administrador. */
export interface RecompensaCatalogo {
  idRecompensa: number;
  titulo: string;
  descripcion: string | null;
  millasRequeridas: number;
  valorDescuentoCop: number;
  categoria: string;
  icono: string;
  destacado: boolean;
  orden: number;
}

export interface PromocionVigente {
  idPromocion: number;
  nombre: string;
  descripcion: string | null;
  tipo: 'MULTIPLICADOR' | 'MILLAS_EXTRA' | 'PORCENTAJE_EXTRA';
  valor: number;
  fechaInicio: string;
  fechaFin: string;
  origenAplicable: string;
  nombreRuta: string | null;
  montoMinimo: number;
  topeMillas: number | null;
  icono: string;
  color: string;
}

/** Textos y reglas del programa, administrables desde el sistema interno. */
export interface ConfiguracionPublicaMillas {
  programaActivo: boolean;
  nombrePrograma: string;
  subtitulo: string;
  pesosPorMilla: number;
  valorMillaCop: number;
  bonoBienvenida: number;
  montosRapidos: number[];
  aplicaMultiplicadorNivel: boolean;
  totalNiveles: number;
  promocionesVigentes: PromocionVigente[];
}

export interface CuponMillas {
  idCanje: number;
  codigoCupon: string;
  titulo: string;
  descripcion: string;
  millasCanjeadas: number;
  valorDescuentoCop: number;
  estado: 'ACTIVO' | 'USADO' | 'VENCIDO' | 'CANCELADO';
  fechaCreacion: string;
  fechaVencimiento: string;
  fechaUso?: string | null;
  categoria: string;
  icono: string;
}

export interface ValidarCuponResponse {
  valido: boolean;
  idCanje?: number;
  codigoCupon?: string;
  titulo?: string;
  valorDescuentoCop?: number;
  categoria?: string;
  fechaVencimiento?: string;
  mensaje?: string;
}

export interface AsientoCompraMillasDTO {
  idAsientoViaje: number;
  idPuntoOrigen: number;
  idPuntoDestino: number;
  monto: number;
  nombrePasajero: string;
  apellidoPasajero: string;
  tipoDocumento: string;
  documento: string;
  telefono?: string;
  correoPasajero?: string;
  esComprador?: boolean;
}

export interface ResultadoCompraMillas {
  success: boolean;
  referencia: string;
  tiquetes: Array<{
    idTiquete: number;
    codigoTiquete: string;
    numeroAsiento: number;
  }>;
  montoTotalCop: number;
  descuentoCuponCop: number;
  millasDebitadas: number;
  saldoRestante: number;
}

export const millasApi = {
  async obtenerRecompensas(): Promise<RecompensaCatalogo[]> {
    const res = await httpClient.get<{ success: boolean; data: RecompensaCatalogo[] }>('/millas/recompensas');
    return res.data.data;
  },

  async obtenerConfiguracionPublica(): Promise<ConfiguracionPublicaMillas> {
    const res = await httpClient.get<{ success: boolean; data: ConfiguracionPublicaMillas }>('/millas/configuracion-publica');
    return res.data.data;
  },

  async obtenerResumen(): Promise<MillasResumen> {
    const res = await httpClient.get<{ success: boolean; data: MillasResumen }>('/millas/resumen');
    return res.data.data;
  },

  async obtenerHistorial(): Promise<MovimientoMilla[]> {
    const res = await httpClient.get<{ success: boolean; data: MovimientoMilla[] }>('/millas/historial');
    return res.data.data;
  },

  async obtenerNiveles(): Promise<NivelBeneficio[]> {
    const res = await httpClient.get<{ success: boolean; data: NivelBeneficio[] }>('/millas/niveles-beneficios');
    return res.data.data;
  },

  async calcularEstimado(monto: number): Promise<EstimadoMillas> {
    const res = await httpClient.post<{ success: boolean; data: EstimadoMillas }>('/millas/calcular-estimado', { monto });
    return res.data.data;
  },

  async canjearRecompensa(idRecompensa: number): Promise<{
    idCanje: number;
    codigoCupon: string;
    titulo: string;
    millasCanjeadas: number;
    valorDescuentoCop: number;
    fechaVencimiento: string;
    saldoRestante: number;
  }> {
    const res = await httpClient.post<{ success: boolean; data: any }>('/millas/canjear-recompensa', { idRecompensa });
    return res.data.data;
  },

  async obtenerMisCupones(): Promise<CuponMillas[]> {
    const res = await httpClient.get<{ success: boolean; data: CuponMillas[] }>('/millas/mis-cupones');
    return res.data.data;
  },

  async validarCupon(codigoCupon: string): Promise<ValidarCuponResponse> {
    const res = await httpClient.post<{ success: boolean; data: ValidarCuponResponse }>('/millas/validar-cupon', { codigoCupon });
    return res.data.data;
  },

  async comprarViajeConMillas(payload: {
    idViaje: number;
    asientos: AsientoCompraMillasDTO[];
    codigoCupon?: string;
    usarDescuentoMillas?: boolean;
  }): Promise<ResultadoCompraMillas> {
    const res = await httpClient.post<{ success: boolean; data: ResultadoCompraMillas }>('/millas/comprar-viaje', payload);
    return res.data.data;
  },
};

