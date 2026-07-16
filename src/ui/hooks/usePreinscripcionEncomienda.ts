import { useState, useRef, useCallback } from 'react';
import {
  encomiendasApi,
  type OficinaEncomiendaAPI,
  type CotizarEncomiendaDTO,
  type CrearPreinscripcionDTO,
  type PreinscripcionResultadoAPI,
} from '../../infrastructure/api/encomiendasApi';

const DEBOUNCE_MS = 500;

function extraerMensajeError(err: unknown, mensajePorDefecto: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr.response?.data?.message || mensajePorDefecto;
}

export function usePreinscripcionEncomienda() {
  const [oficinas, setOficinas] = useState<OficinaEncomiendaAPI[]>([]);
  const [loadingOficinas, setLoadingOficinas] = useState(false);
  const [errorOficinas, setErrorOficinas] = useState('');

  const [cotizacion, setCotizacion] = useState<number | null>(null);
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);
  const [errorCotizacion, setErrorCotizacion] = useState('');

  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [resultado, setResultado] = useState<PreinscripcionResultadoAPI | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargarOficinas = useCallback(async () => {
    setLoadingOficinas(true);
    setErrorOficinas('');
    try {
      const data = await encomiendasApi.getOficinasSelect();
      setOficinas(data);
    } catch (err: unknown) {
      setErrorOficinas(extraerMensajeError(err, 'No se pudieron cargar las oficinas'));
    } finally {
      setLoadingOficinas(false);
    }
  }, []);

  /** Dispara la cotización con debounce para no saturar el backend en cada tecla. */
  const cotizarConDebounce = useCallback((datos: CotizarEncomiendaDTO) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoadingCotizacion(true);
      setErrorCotizacion('');
      setCotizacion(null);
      try {
        const valor = await encomiendasApi.cotizar(datos);
        setCotizacion(valor);
      } catch (err: unknown) {
        setErrorCotizacion(extraerMensajeError(err, 'No se pudo calcular la cotización'));
      } finally {
        setLoadingCotizacion(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const limpiarCotizacion = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCotizacion(null);
    setErrorCotizacion('');
    setLoadingCotizacion(false);
  }, []);

  const enviarPreinscripcion = useCallback(async (datos: CrearPreinscripcionDTO) => {
    setLoadingEnvio(true);
    setErrorEnvio('');
    try {
      const data = await encomiendasApi.crearPreinscripcion(datos);
      setResultado(data);
      return data;
    } catch (err: unknown) {
      const msg = extraerMensajeError(err, 'No se pudo generar la preinscripción');
      setErrorEnvio(msg);
      throw err;
    } finally {
      setLoadingEnvio(false);
    }
  }, []);

  const reiniciar = useCallback(() => {
    setResultado(null);
    setErrorEnvio('');
    limpiarCotizacion();
  }, [limpiarCotizacion]);

  return {
    oficinas,
    loadingOficinas,
    errorOficinas,
    cargarOficinas,

    cotizacion,
    loadingCotizacion,
    errorCotizacion,
    cotizarConDebounce,
    limpiarCotizacion,

    loadingEnvio,
    errorEnvio,
    resultado,
    enviarPreinscripcion,
    reiniciar,
  };
}
