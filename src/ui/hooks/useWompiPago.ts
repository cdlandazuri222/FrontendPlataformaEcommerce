import { useState } from 'react';
import { wompiApi, type CompletarPerfilDTO, type DatosTransaccionWompi, type PrepararTransaccionDTO } from '../../infrastructure/api/wompiApi';

export type FasePago = 'idle' | 'verificando' | 'formulario' | 'preparando' | 'widget' | 'error';

interface UseWompiPagoReturn {
  fase: FasePago;
  datosTransaccion: DatosTransaccionWompi | null;
  error: string | null;
  iniciarPago: (params: PrepararTransaccionDTO) => Promise<void>;
  completarPerfil: (datos: CompletarPerfilDTO) => Promise<void>;
  resetear: () => void;
}

export function useWompiPago(): UseWompiPagoReturn {
  const [fase, setFase] = useState<FasePago>('idle');
  const [datosTransaccion, setDatosTransaccion] = useState<DatosTransaccionWompi | null>(null);
  const [error, setError] = useState<string | null>(null);


  const [paramsPendientes, setParamsPendientes] = useState<PrepararTransaccionDTO | null>(null);

  const iniciarPago = async (params: PrepararTransaccionDTO) => {
    setError(null);
    setFase('verificando');
    setParamsPendientes(params);

    try {
      const { estadousuario } = await wompiApi.obtenerEstadoCliente();
      console.log('[Wompi] estadousuario:', estadousuario);

      if (estadousuario === 'INACTIVO') {
        setError('Debes verificar tu correo electrónico antes de realizar un pago.');
        setFase('error');
        return;
      }

      if (estadousuario === 'INCOMPLETO') {
        setFase('formulario');
        return;
      }


      await _prepararYMostrarWidget(params);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al verificar el estado del cliente';
      setError(msg);
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
      let msg = 'Error al actualizar el perfil';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        msg = axiosError.response?.data?.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      
      setError(msg);
    }
  };

  const _prepararYMostrarWidget = async (params: PrepararTransaccionDTO) => {
    setFase('preparando');
    try {
      console.log('[Wompi] Preparando transacción con params:', params);
      const datos = await wompiApi.prepararTransaccion(params);
      console.log('[Wompi] Datos recibidos del backend:', datos);
      console.log('[Wompi] Tipo de datos:', typeof datos);
      console.log('[Wompi] Keys de datos:', Object.keys(datos));
      setDatosTransaccion(datos);
      console.log('[Wompi] Cambiando fase a widget');
      setFase('widget');
    } catch (err: unknown) {
      console.error('[Wompi] Error preparando transacción:', err);
      
      // Extraer mensaje de error del backend
      let msg = 'Error al preparar el pago';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        msg = axiosError.response?.data?.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      
      setError(msg);
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
