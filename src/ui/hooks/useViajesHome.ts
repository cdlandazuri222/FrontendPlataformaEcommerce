import { useState, useEffect, useCallback, useRef } from 'react';
import {
  plataformaEcommerceApi,
  type ViajeAPI,
  type ViajesQuery,
} from '../../infrastructure/api/plataformaEcommerceApi';


export interface ViajesHomeState {
  viajesHoy: ViajeAPI[];
  viajesProgramados: ViajeAPI[];
  totalHoy: number;
  totalProgramados: number;
  paginaActual: number;
  totalPaginas: number;
  loading: boolean;
  error: string | null;
}


const CACHE_TTL_MS = 60_000;


interface CacheEntry {
  data: Awaited<ReturnType<typeof plataformaEcommerceApi.getViajes>>;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(params: ViajesQuery): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): CacheEntry['data'] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: CacheEntry['data']): void {
  cache.set(key, { data, timestamp: Date.now() });
}




export function useViajesHome(filtros: ViajesQuery = {}) {
  const [state, setState] = useState<ViajesHomeState>({
    viajesHoy: [],
    viajesProgramados: [],
    totalHoy: 0,
    totalProgramados: 0,
    paginaActual: 1,
    totalPaginas: 1,
    loading: true,
    error: null,
  });


  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchViajes = useCallback(
    async (params: ViajesQuery, forceRefresh = false) => {
      const cacheKey = getCacheKey(params);

      if (!forceRefresh) {
        const cached = getFromCache(cacheKey);
        if (cached) {
          if (mountedRef.current) {
            setState({
              viajesHoy: cached.viajesHoy,
              viajesProgramados: cached.viajesProgramados,
              totalHoy: cached.totalHoy,
              totalProgramados: cached.totalProgramados,
              paginaActual: cached.paginacion.paginaActual,
              totalPaginas: cached.paginacion.totalPaginas,
              loading: false,
              error: null,
            });
          }
          return;
        }
      }

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      try {
        const data = await plataformaEcommerceApi.getViajes(params);
        setCache(cacheKey, data);

        if (mountedRef.current) {
          setState({
            viajesHoy: data.viajesHoy,
            viajesProgramados: data.viajesProgramados,
            totalHoy: data.totalHoy,
            totalProgramados: data.totalProgramados,
            paginaActual: data.paginacion.paginaActual,
            totalPaginas: data.paginacion.totalPaginas,
            loading: false,
            error: null,
          });
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;

        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        let errorMsg = 'Error al cargar los viajes. Intente nuevamente.';

        if (axiosErr.response?.status === 404) {
          errorMsg = 'No se encontraron viajes disponibles.';
        } else if ((axiosErr.response?.status ?? 0) >= 500) {
          errorMsg = 'Error del servidor. Intente nuevamente más tarde.';
        } else if (!axiosErr.response) {
          errorMsg = 'Error de conexión. Verifique su internet.';
        }

        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
      }
    },
    []
  );

  // Carga inicial y cuando cambian los filtros
  useEffect(() => {
    fetchViajes(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  /** Fuerza una recarga ignorando el cache. */
  const refetch = useCallback(() => {
    fetchViajes(filtros, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  /** Cambia de página. */
  const irAPagina = useCallback(
    (page: number) => {
      fetchViajes({ ...filtros, page });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filtros)]
  );

  return { ...state, refetch, irAPagina };
}
