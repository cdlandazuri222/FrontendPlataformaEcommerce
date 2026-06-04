import { useState } from 'react';
import { wompiApi, type CompletarPerfilDTO, type DatosTransaccionWompi, type PrepararTransaccionDTO, type AsientoTransaccionDTO } from '../../infrastructure/api/wompiApi';

export type FasePago = 'idle' | 'verificando' | 'formulario' | 'preparando' | 'widget' | 'error';

export interface ErrorPago {
  mensaje: string;
  codigo?: string;
  status?: number;
}

interface UseWompiPagoReturn {
  fase: FasePago;
  datosTransaccion: DatosTransaccionWompi | null;
  error: ErrorPago | null;
  iniciarPago: (idViaje: number, asientos: AsientoTransaccionDTO[]) => Promise<void>;
  completarPerfil: (datos: CompletarPerfilDTO) => Promise<void>;
  resetear: () => void;
}

export function useWompiPago(): UseWompiPagoReturn {
  const [fase, setFase] = useState<FasePago>('idle');
  const [datosTransaccion, setDatosTransaccion] = useState<DatosTransaccionWompi | null>(null);
  const [error, setError] = useState<ErrorPago | null>(null);
  const [paramsPendientes, setParamsPendientes] = useState<PrepararTransaccionDTO | null>(null);

  const iniciarPago = async (idViaje: number, asientos: AsientoTransaccionDTO[]) => {
    setError(null);
    setFase('verificando');

    const payload: PrepararTransaccionDTO = { idViaje, asientos };
    setParamsPendientes(payload);

    try {
      const { estadousuario } = await wompiApi.obtenerEstadoCliente();

      if (estadousuario === 'INACTIVO') {
        setError({ mensaje: 'Debes verificar tu correo electrónico antes de realizar un pago.', codigo: 'CORREO_NO_VERIFICADO' });
        setFase('error');
        return;
      }

      if (estadousuario === 'INCOMPLETO') {
        setFase('formulario');
        return;
      }

      await _prepararYMostrarWidget(payload);
    } catch (err: unknown) {
      const errorPago = extraerError(err);
      setError(errorPago);
      setFase('error');
    }
  };

  const completarPerfil = async (datos: CompletarPerfilDTO) => {
    setError(null);
    try {
      await wompiApi.completarPerfil(datos);

      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        localStorage.setItem('usuario', JSON.stringify({
          ...usuario,
          nombre: datos.nombre,
          apellido: datos.apellido,
          documento: datos.documento,
          telefono: datos.telefono,
          estadousuario: 'COMPLETO'
        }));
      }

      if (paramsPendientes) {
        await _prepararYMostrarWidget(paramsPendientes);
      }
    } catch (err: unknown) {
      const errorPago = extraerError(err);
      setError(errorPago);
    }
  };

  const _prepararYMostrarWidget = async (params: PrepararTransaccionDTO) => {
    setFase('preparando');
    try {
      const datos = await wompiApi.prepararTransaccion(params);
      setDatosTransaccion(datos);
      setFase('widget');
    } catch (err: unknown) {
      const errorPago = extraerError(err);
      setError(errorPago);
      setFase('error');
    }
  };

  const resetear = () => {
    setFase('idle');
    setDatosTransaccion(null);
    setError(null);
    setParamsPendientes(null);
  };

  return { fase, datosTransaccion, error, iniciarPago, completarPerfil, resetear };
}

function extraerError(err: unknown): ErrorPago {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosError = err as any;
    const data = axiosError.response?.data;
    const status = axiosError.response?.status;
    return {
      mensaje: data?.message || 'Error al procesar el pago',
      codigo: data?.codigo,
      status,
    };
  }
  if (err instanceof Error) {
    return { mensaje: err.message };
  }
  return { mensaje: 'Error inesperado al procesar el pago' };
}
