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

export const millasApi = {
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
};
