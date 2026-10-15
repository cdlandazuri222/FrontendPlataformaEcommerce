import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { SelectorAsientos, type AsientoConEstado, type EstadoAsiento } from '../../components/common/SelectorAsientos';
import { ROUTES } from '../../../shared/constants';
import { httpClient } from '../../../infrastructure/api/httpClient';
import { useAsientosRealtime } from '../../hooks/useAsientosRealtime';
import { useWompiPago } from '../../hooks/useWompiPago';
import type { AsientoTransaccionDTO } from '../../../infrastructure/api/wompiApi';
import { wompiApi } from '../../../infrastructure/api/wompiApi';
import busCootranar from '../../../assets/busCootranar.png';
import { WompiCheckout } from '../../components/pago/WompiCheckout';
import { FormularioCompletarPerfil } from '../../components/pago/FormularioCompletarPerfil';
import { usePreferencias } from '../../context/PreferenciasContext';
import {
  millasApi,
  type MillasResumen,
  type ConfiguracionPublicaMillas,
  type CuponMillas,
  type AsientoCompraMillasDTO,
} from '../../../infrastructure/api/millasApi';

const MAX_ASIENTOS = 10;

const LEYENDA_BASE = [
  { key: 'disponible' as const, color: 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600' },
  { key: 'vendido'    as const, color: 'bg-[#0e3a8c]' },
  { key: 'reservado'  as const, color: 'bg-yellow-400' },
  { key: 'seleccionado' as const, color: 'bg-green-500' },
];

interface LocationState {
  idviaje: number;
  origen: string;
  destino: string;
  idPuntoOrigen: number | null;
  idPuntoDestino: number | null;
  rutaCompleta: string | null;
  fecha: string;
  hora: string;
  precio: number | null;
  placa: string;
  movil: string;
  tipoBus: string;
  etiqueta: string;
}

interface DetalleViaje {
  idviaje: number;
  codigoviaje: string;
  fechasalida: string;
  horasalida: string;
  ruta: { idruta: number; nombre: string; via: string; origen: string; destino: string };
  vehiculo: { idvehiculo: number; numeromovil: string; placa: string; capacidad: number; cantidadpisos: number; distribucionasientos: { columnas: number; distribucion: any[] } };
  tipoBus: { idtipobus: number; nombre: string; descripcion: string };
  tipoServicio: { idtiposervicio: number; nombre: string };
  imagendestino?: string;
}

interface AsientosResponse {
  asientos: AsientoConEstado[];
  tiempoMaxReservaMin: number;
}

export interface AsientoSeleccionadoInfo {
  idasientoviaje: number;
  numeroasiento: number;
  precio: number;
  espoltrona: boolean;
}

// Datos de pasajero por formulario
interface DatosPasajero {
  nombrePasajero: string;
  apellidoPasajero: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  correoPasajero: string;
  esComprador: boolean;
}

interface PasajeroSugerencia {
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  correo: string;
}

// (LEYENDA_BASE is defined above and used inside the component)


export function SeleccionAsientosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { tx } = usePreferencias();
  const s = tx.seleccionAsientos;

  // Tipos de documento traducidos
  const TIPOS_DOCUMENTO = [
    { value: 'CC', label: s.cedula },
    { value: 'TI', label: s.tarjetaIdentidad },
    { value: 'CE', label: s.cedulaExtranjeria },
    { value: 'PA', label: s.pasaporte },
  ];

  // Leyenda traducida
  const LEYENDA = [
    { label: s.disponible,   color: LEYENDA_BASE[0].color },
    { label: s.vendido,      color: LEYENDA_BASE[1].color },
    { label: s.reservado,    color: LEYENDA_BASE[2].color },
    { label: s.seleccionado, color: LEYENDA_BASE[3].color },
  ];

  // --- Estado del mapa de asientos ---
  const [detalle, setDetalle] = useState<DetalleViaje | null>(null);
  const [asientos, setAsientos] = useState<AsientoConEstado[]>([]);
  const [tiempoMaxMin, setTiempoMaxMin] = useState(15);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<AsientoSeleccionadoInfo[]>([]);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [puntosResueltos, setPuntosResueltos] = useState<{ idPuntoOrigen: number | null; idPuntoDestino: number | null }>({
    idPuntoOrigen: null,
    idPuntoDestino: null
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const asientosReservadosRef = useRef<Set<number>>(new Set());
  const asientosPendientesRef = useRef<Set<number>>(new Set());

  // --- Estado de formularios de pasajeros ---
  const [pasajeros, setPasajeros] = useState<DatosPasajero[]>([]);
  const [erroresPasajeros, setErroresPasajeros] = useState<Record<number, Record<string, string>>>({});
  const [sugerencias, setSugerencias] = useState<Record<number, PasajeroSugerencia[]>>({});
  const [sugerenciaActiva, setSugerenciaActiva] = useState<number | null>(null);
  const [buscando, setBuscando] = useState<Record<number, boolean>>({});
  const [usarMisDatosIdx, setUsarMisDatosIdx] = useState<number | null>(null);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // --- Estados de Millas y Cupones ---
  const tm = tx.millas;
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const estaAutenticado = Boolean(token || localStorage.getItem('usuario'));
  const [metodoPago, setMetodoPago] = useState<'WOMPI' | 'MILLAS'>('WOMPI');
  const [resumenMillas, setResumenMillas] = useState<MillasResumen | null>(null);
  const [configMillas, setConfigMillas] = useState<ConfiguracionPublicaMillas | null>(null);
  const [misCupones, setMisCupones] = useState<CuponMillas[]>([]);
  const [cargandoMillas, setCargandoMillas] = useState(false);
  const [procesandoMillas, setProcesandoMillas] = useState(false);

  // Cupón
  const [codigoCuponInput, setCodigoCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<{
    codigoCupon: string;
    tipoDescuento: string;
    valor: number;
    descripcion: string;
    valorDescuentoCop: number;
  } | null>(null);
  const [errorCupon, setErrorCupon] = useState<string | null>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);

  // Cargar configuración pública siempre (no requiere auth)
  useEffect(() => {
    millasApi.obtenerConfiguracionPublica()
      .then(cfg => { if (cfg) setConfigMillas(cfg); })
      .catch(() => {});
  }, []);

  // Cargar saldo de millas y cupones del usuario autenticado
  useEffect(() => {
    if (!estaAutenticado) return;
    let cancelado = false;
    setCargandoMillas(true);
    Promise.all([
      millasApi.obtenerResumen().catch(() => null),
      millasApi.obtenerMisCupones().catch(() => []),
    ]).then(([resumen, cupones]) => {
      if (cancelado) return;
      if (resumen) setResumenMillas(resumen);
      if (cupones) setMisCupones(cupones.filter(c => c.estado === 'ACTIVO'));
    }).finally(() => {
      if (!cancelado) setCargandoMillas(false);
    });
    return () => { cancelado = true; };
  }, [estaAutenticado]);

  // --- Hook de pago Wompi ---
  const { fase, datosTransaccion, error: errorPago, iniciarPago, completarPerfil, resetear } = useWompiPago();

  // --- Redirigir si no hay viaje ---
  useEffect(() => {
    if (!state?.idviaje) navigate(ROUTES.HOME, { replace: true });
  }, [state, navigate]);

  // --- Cargar datos del viaje y asientos ---
  useEffect(() => {
    if (!state?.idviaje) return;

    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);

        let idPuntoOrigen = state.idPuntoOrigen;
        let idPuntoDestino = state.idPuntoDestino;

        if ((!idPuntoOrigen || !idPuntoDestino) && state.origen && state.destino) {
          try {
            const puntosRes = await httpClient.get<{ data: { idpuntoorigen: number; idpuntodestino: number } }>(
              `/plataforma-ecommerce/viaje/${state.idviaje}/resolver-tramo`,
              { params: { origen: state.origen, destino: state.destino } }
            );
            idPuntoOrigen = puntosRes.data.data.idpuntoorigen;
            idPuntoDestino = puntosRes.data.data.idpuntodestino;
          } catch { /* si falla, continuar sin puntos */ }
        }

        setPuntosResueltos({ idPuntoOrigen, idPuntoDestino });

        const [detalleRes, asientosRes] = await Promise.all([
          httpClient.get<{ data: DetalleViaje }>(`/plataforma-ecommerce/viaje/${state.idviaje}/detalle`),
          httpClient.get<{ data: AsientosResponse }>(
            `/plataforma-ecommerce/viaje/${state.idviaje}/asientos`,
            { params: { idPuntoOrigen: idPuntoOrigen ?? 0, idPuntoDestino: idPuntoDestino ?? 0 } }
          )
        ]);

        setDetalle(detalleRes.data.data);
        setAsientos(asientosRes.data.data.asientos);
        setTiempoMaxMin(asientosRes.data.data.tiempoMaxReservaMin);
      } catch {
        setError('No se pudo cargar la información del viaje. Intenta de nuevo.');
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [state?.idviaje, state?.idPuntoOrigen, state?.idPuntoDestino]);

  // --- Realtime ---
  const handleCambioRealtime = useCallback((idasientoviaje: number, nuevoEstado: EstadoAsiento) => {
    if (asientosPendientesRef.current.has(idasientoviaje) && nuevoEstado === 'RESERVADO') {
      asientosPendientesRef.current.delete(idasientoviaje);
      setAsientos(prev => prev.map(a =>
        a.idasientoviaje === idasientoviaje ? { ...a, estado: 'SELECCIONADO' as EstadoAsiento } : a
      ));
      return;
    }
    if (asientosReservadosRef.current.has(idasientoviaje)) {
      if (nuevoEstado === 'RESERVADO') {
        setAsientos(prev => prev.map(a =>
          a.idasientoviaje === idasientoviaje ? { ...a, estado: 'SELECCIONADO' as EstadoAsiento } : a
        ));
      }
      return;
    }
    setAsientos(prev => prev.map(a =>
      a.idasientoviaje === idasientoviaje ? { ...a, estado: nuevoEstado } : a
    ));
  }, []);

  // Refetch puntual al reconectar el canal Realtime (cubre truncates y caídas de conexión)
  const handleReconectarRealtime = useCallback(async () => {
    if (!state?.idviaje || !puntosResueltos.idPuntoOrigen || !puntosResueltos.idPuntoDestino) return;
    try {
      const res = await httpClient.get<{ data: AsientosResponse }>(
        `/plataforma-ecommerce/viaje/${state.idviaje}/asientos`,
        { params: { idPuntoOrigen: puntosResueltos.idPuntoOrigen, idPuntoDestino: puntosResueltos.idPuntoDestino } }
      );
      const nuevos = res.data.data.asientos;
      setAsientos(prev => prev.map(a => {
        if (asientosReservadosRef.current.has(a.idasientoviaje)) return a;
        const actualizado = nuevos.find(n => n.idasientoviaje === a.idasientoviaje);
        return actualizado ?? a;
      }));
    } catch { /* silencioso */ }
  }, [state?.idviaje, puntosResueltos.idPuntoOrigen, puntosResueltos.idPuntoDestino]);

  const primerReservado = asientosSeleccionados.length > 0 ? asientosSeleccionados[0].idasientoviaje : null;
  useAsientosRealtime(state?.idviaje ?? null, primerReservado, handleCambioRealtime, handleReconectarRealtime);

  // --- useEffect: liberar asientos al salir (cierre o reload) via sendBeacon ---
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const handlePageHide = () => {
      const ids = Array.from(asientosReservadosRef.current);
      if (ids.length === 0) return;
      const url = `${apiBase}/asientos/liberar-lote`;
      const blob = new Blob([JSON.stringify({ ids })], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      // Cleanup por desmontaje (navegación interna React Router)
      const ids = Array.from(asientosReservadosRef.current);
      if (ids.length === 0) return;
      // Liberar cada asiento via fetch (no sendBeacon porque aún estamos en la SPA)
      ids.forEach(id => {
        httpClient.post(`/asientos/${id}/liberar`).catch(() => {});
      });
    };
  }, []);

  // --- Temporizador compartido ---
  const iniciarCountdown = useCallback((minutos: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let segundos = minutos * 60;
    setSegundosRestantes(segundos);
    timerRef.current = setInterval(() => {
      segundos -= 1;
      setSegundosRestantes(segundos);
      if (segundos <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setSegundosRestantes(null);
        const ids = Array.from(asientosReservadosRef.current);
        asientosReservadosRef.current.clear();
        asientosPendientesRef.current.clear();
        setAsientosSeleccionados([]);
        setPasajeros([]);
        setUsarMisDatosIdx(null);
        setAsientos(prev => prev.map(a =>
          ids.includes(a.idasientoviaje) ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
        ));
        for (const id of ids) {
          httpClient.post(`/asientos/${id}/liberar`).catch(() => {});
        }
        setErrorMsg('El tiempo de reserva ha expirado. Los asientos han sido liberados.');
      }
    }, 1000);
  }, []);

  const detenerCountdown = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setSegundosRestantes(null);
  }, []);


  // --- Sincronizar formularios de pasajeros con asientos seleccionados ---
  // Solo se usa para agregar formularios nuevos al final. La eliminación se
  // maneja directamente en handleSeleccionar para usar el índice correcto.
  useEffect(() => {
    const numAsientos = asientosSeleccionados.length;

    if (numAsientos === 0) {
      setPasajeros([]);
      if (usarMisDatosIdx !== null) setUsarMisDatosIdx(null);
      return;
    }

    setPasajeros(prev => {
      if (prev.length >= numAsientos) return prev; // la reducción se hace en handleSeleccionar
      // Agregar formularios vacíos para asientos nuevos al final
      const nuevos = [...prev];
      for (let i = prev.length; i < numAsientos; i++) {
        nuevos.push({ nombrePasajero: '', apellidoPasajero: '', tipoDocumento: 'CC', documento: '', telefono: '', correoPasajero: '', esComprador: i === 0 });
      }
      return nuevos;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asientosSeleccionados.length]);

  // --- Selección/deselección de asientos ---
  const handleSeleccionar = async (asiento: AsientoConEstado) => {
    setErrorMsg(null);
    const yaSeleccionado = asientosReservadosRef.current.has(asiento.idasientoviaje) || asiento.estado === 'SELECCIONADO';

    if (yaSeleccionado) {
      const idLiberar = asiento.idasientoviaje;
      const idxRemovido = asientosSeleccionados.findIndex(a => a.idasientoviaje === idLiberar);
      asientosReservadosRef.current.delete(idLiberar);
      asientosPendientesRef.current.delete(idLiberar);
      setAsientosSeleccionados(prev => prev.filter(a => a.idasientoviaje !== idLiberar));
      // Eliminar el formulario en el índice correcto (no siempre el último)
      if (idxRemovido >= 0) {
        setPasajeros(prev => {
          if (prev.length === 0) return prev;
          const copia = [...prev];
          copia.splice(idxRemovido, 1);
          // Reajustar esComprador: siempre el primero es el comprador
          if (copia.length > 0) copia[0] = { ...copia[0], esComprador: true };
          return copia;
        });
      }
      setAsientos(prev => prev.map(a =>
        a.idasientoviaje === idLiberar ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
      ));
      // Ajustar índice del toggle "Yo soy este pasajero"
      if (usarMisDatosIdx === idxRemovido) setUsarMisDatosIdx(null);
      else if (usarMisDatosIdx !== null && usarMisDatosIdx > idxRemovido) setUsarMisDatosIdx(usarMisDatosIdx - 1);
      try { await httpClient.post(`/asientos/${idLiberar}/liberar`); } catch { /* silencioso */ }
      if (asientosReservadosRef.current.size === 0) detenerCountdown();
      return;
    }

    if (asientosSeleccionados.length >= MAX_ASIENTOS) {
      setErrorMsg(`${s.maxAsientos} ${MAX_ASIENTOS} ${s.maxAsientosSufijo}`);
      return;
    }

    asientosPendientesRef.current.add(asiento.idasientoviaje);
    const nuevaSeleccion: AsientoSeleccionadoInfo = {
      idasientoviaje: asiento.idasientoviaje,
      numeroasiento: asiento.numeroasiento,
      precio: asiento.precio ?? 0,
      espoltrona: asiento.espoltrona,
    };
    setAsientosSeleccionados(prev => [...prev, nuevaSeleccion]);

    try {
      await httpClient.post(`/asientos/${asiento.idasientoviaje}/reservar`);
      asientosReservadosRef.current.add(asiento.idasientoviaje);
      asientosPendientesRef.current.delete(asiento.idasientoviaje);
      if (asientosReservadosRef.current.size === 1) iniciarCountdown(tiempoMaxMin);
    } catch (err: any) {
      asientosPendientesRef.current.delete(asiento.idasientoviaje);
      setAsientosSeleccionados(prev => prev.filter(a => a.idasientoviaje !== asiento.idasientoviaje));
      const msg = err?.response?.data?.message ?? 'El asiento ya no está disponible';
      setErrorMsg(msg);
      if (puntosResueltos.idPuntoOrigen && puntosResueltos.idPuntoDestino) {
        try {
          const res = await httpClient.get<{ data: AsientosResponse }>(
            `/plataforma-ecommerce/viaje/${state?.idviaje}/asientos`,
            { params: { idPuntoOrigen: puntosResueltos.idPuntoOrigen, idPuntoDestino: puntosResueltos.idPuntoDestino } }
          );
          const nuevos = res.data.data.asientos;
          setAsientos(prev => prev.map(a => {
            if (asientosReservadosRef.current.has(a.idasientoviaje)) return a;
            const actualizado = nuevos.find(n => n.idasientoviaje === a.idasientoviaje);
            return actualizado ?? a;
          }));
        } catch { /* silencioso */ }
      }
    }
  };

  // --- Eliminar asiento directamente desde el formulario de pasajero ---
  const handleEliminarAsientoDesdeFormulario = async (idx: number) => {
    const asientoInfo = asientosSeleccionados[idx];
    if (!asientoInfo) return;
    const idLiberar = asientoInfo.idasientoviaje;
    asientosReservadosRef.current.delete(idLiberar);
    asientosPendientesRef.current.delete(idLiberar);
    setAsientosSeleccionados(prev => prev.filter((_, i) => i !== idx));
    setPasajeros(prev => {
      const copia = [...prev];
      copia.splice(idx, 1);
      if (copia.length > 0) copia[0] = { ...copia[0], esComprador: true };
      return copia;
    });
    setAsientos(prev => prev.map(a =>
      a.idasientoviaje === idLiberar ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
    ));
    if (usarMisDatosIdx === idx) setUsarMisDatosIdx(null);
    else if (usarMisDatosIdx !== null && usarMisDatosIdx > idx) setUsarMisDatosIdx(usarMisDatosIdx - 1);
    try { await httpClient.post(`/asientos/${idLiberar}/liberar`); } catch { /* silencioso */ }
    if (asientosReservadosRef.current.size === 0) detenerCountdown();
  };

  // --- Lógica de formularios de pasajeros ---
  const validarPasajero = useCallback((datos: DatosPasajero): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!datos.nombrePasajero.trim()) errs.nombrePasajero = 'El nombre es obligatorio';
    if (!datos.apellidoPasajero.trim()) errs.apellidoPasajero = 'El apellido es obligatorio';
    if (!datos.tipoDocumento) errs.tipoDocumento = 'Selecciona un tipo de documento';
    if (!datos.documento.trim()) errs.documento = 'El documento es obligatorio';
    return errs;
  }, []);

  const formularioValido = useCallback((): boolean => {
    if (pasajeros.length === 0 || pasajeros.length !== asientosSeleccionados.length) return false;
    for (const p of pasajeros) {
      const errs = validarPasajero(p);
      if (Object.keys(errs).length > 0) return false;
    }
    return true;
  }, [pasajeros, asientosSeleccionados.length, validarPasajero]);

  // Toggle exclusivo "Yo soy este pasajero"
  const handleToggleUsarMisDatos = (index: number, checked: boolean) => {
    const usuario = localStorage.getItem('usuario');
    const datosUsuario = usuario ? JSON.parse(usuario) : null;

    if (checked) {
      // Desactivar el anterior si había uno
      if (usarMisDatosIdx !== null && usarMisDatosIdx !== index) {
        setPasajeros(prev => {
          const copia = [...prev];
          copia[usarMisDatosIdx!] = { ...copia[usarMisDatosIdx!], nombrePasajero: '', apellidoPasajero: '', tipoDocumento: 'CC', documento: '', telefono: '', correoPasajero: '' };
          return copia;
        });
      }
      setUsarMisDatosIdx(index);
      if (datosUsuario) {
        setPasajeros(prev => {
          const copia = [...prev];
          copia[index] = {
            ...copia[index],
            nombrePasajero: datosUsuario.nombre || '',
            apellidoPasajero: datosUsuario.apellido || '',
            tipoDocumento: datosUsuario.tipoDocumento || 'CC',
            documento: datosUsuario.documento || '',
            telefono: datosUsuario.telefono || '',
            correoPasajero: datosUsuario.correo || '',
          };
          return copia;
        });
      }
    } else {
      setUsarMisDatosIdx(null);
      setPasajeros(prev => {
        const copia = [...prev];
        copia[index] = { ...copia[index], nombrePasajero: '', apellidoPasajero: '', tipoDocumento: 'CC', documento: '', telefono: '', correoPasajero: '' };
        return copia;
      });
    }
    setErroresPasajeros(prev => ({ ...prev, [index]: {} }));
  };

  const handleChangePasajero = (index: number, campo: keyof DatosPasajero, valor: string) => {
    setPasajeros(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
    setErroresPasajeros(prev => {
      const copia = { ...prev };
      if (copia[index]) { const { [campo]: _, ...rest } = copia[index]; copia[index] = rest; }
      return copia;
    });
    // Autocompletado por documento (solo si no tiene toggle activo)
    if (campo === 'documento' && usarMisDatosIdx !== index) {
      buscarPasajeroDebounced(index, valor);
    }
  };

  const buscarPasajeroDebounced = (index: number, documento: string) => {
    if (debounceTimers.current[index]) clearTimeout(debounceTimers.current[index]);
    if (documento.length < 4) { setSugerencias(prev => ({ ...prev, [index]: [] })); setSugerenciaActiva(null); return; }
    debounceTimers.current[index] = setTimeout(async () => {
      setBuscando(prev => ({ ...prev, [index]: true }));
      try {
        const res = await httpClient.get<{ pasajeros: PasajeroSugerencia[] }>('/wompi/pasajeros/buscar', { params: { documento } });
        setSugerencias(prev => ({ ...prev, [index]: res.data.pasajeros || [] }));
        setSugerenciaActiva(index);
      } catch { setSugerencias(prev => ({ ...prev, [index]: [] })); }
      finally { setBuscando(prev => ({ ...prev, [index]: false })); }
    }, 400);
  };

  const seleccionarSugerencia = (index: number, sugerencia: PasajeroSugerencia) => {
    setPasajeros(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], nombrePasajero: sugerencia.nombre, apellidoPasajero: sugerencia.apellido, tipoDocumento: sugerencia.tipoDocumento || 'CC', documento: sugerencia.documento, telefono: sugerencia.telefono || '', correoPasajero: sugerencia.correo || '' };
      return copia;
    });
    setSugerencias(prev => ({ ...prev, [index]: [] }));
    setSugerenciaActiva(null);
    setErroresPasajeros(prev => ({ ...prev, [index]: {} }));
  };

  const handleBlurPasajero = (index: number) => {
    const errs = validarPasajero(pasajeros[index]);
    setErroresPasajeros(prev => ({ ...prev, [index]: errs }));
  };

  const handleCloseSugerencias = () => setSugerenciaActiva(null);


  // --- Confirmar y pagar ---
  const handleConfirmarYPagar = async () => {
    setErrorMsg(null);
    // Validar todos los formularios
    const nuevosErrores: Record<number, Record<string, string>> = {};
    let hayErrores = false;
    pasajeros.forEach((p, idx) => {
      const errs = validarPasajero(p);
      if (Object.keys(errs).length > 0) { nuevosErrores[idx] = errs; hayErrores = true; }
    });
    setErroresPasajeros(nuevosErrores);
    if (hayErrores) return;

    if (!puntosResueltos.idPuntoOrigen || !puntosResueltos.idPuntoDestino) return;

    // Bug 1 fix: si el usuario marcó "Yo soy este pasajero" completar el perfil
    // directamente con esos datos ANTES de iniciar el pago, para evitar que
    // useWompiPago muestre FormularioCompletarPerfil con los mismos campos otra vez.
    if (usarMisDatosIdx !== null) {
      const p = pasajeros[usarMisDatosIdx];
      try {
        await wompiApi.completarPerfil({
          nombre: p.nombrePasajero,
          apellido: p.apellidoPasajero,
          tipoDocumento: p.tipoDocumento,
          documento: p.documento,
          telefono: p.telefono,
        });
        // Actualizar localStorage para que useWompiPago encuentre el perfil COMPLETO
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
          const usuario = JSON.parse(usuarioGuardado);
          localStorage.setItem('usuario', JSON.stringify({
            ...usuario,
            nombre: p.nombrePasajero,
            apellido: p.apellidoPasajero,
            tipoDocumento: p.tipoDocumento,
            documento: p.documento,
            telefono: p.telefono,
            estadousuario: 'COMPLETO',
          }));
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Error al guardar los datos del perfil. Intenta de nuevo.';
        setErrorMsg(msg);
        return; // no continuar al pago
      }
    }

    // Construir payload para Wompi
    const asientosDTO: AsientoTransaccionDTO[] = asientosSeleccionados.map((asiento, idx) => ({
      idAsientoViaje: asiento.idasientoviaje,
      idPuntoOrigen: puntosResueltos.idPuntoOrigen!,
      idPuntoDestino: puntosResueltos.idPuntoDestino!,
      monto: asiento.precio,
      esComprador: idx === 0,
      nombrePasajero: pasajeros[idx].nombrePasajero,
      apellidoPasajero: pasajeros[idx].apellidoPasajero,
      tipoDocumento: pasajeros[idx].tipoDocumento,
      documento: pasajeros[idx].documento,
      telefono: pasajeros[idx].telefono || undefined,
      correoPasajero: pasajeros[idx].correoPasajero || undefined,
    }));

    iniciarPago(state!.idviaje, asientosDTO);
    // Nota: asientosReservadosRef.current se limpia en el useEffect de fase === 'widget'
    // para garantizar que solo se borra cuando el widget ya está activo (pago en curso).
  };

  const handleAplicarCupon = async (codigoOpcional?: string) => {
    const code = (codigoOpcional || codigoCuponInput).trim().toUpperCase();
    if (!code) return;

    if (!estaAutenticado) {
      setErrorCupon('Debes iniciar sesión con tu cuenta para validar o aplicar cupones.');
      return;
    }

    // Orientación si el usuario escribe su número de socio creyendo que es un código de cupón
    if (resumenMillas?.usuario?.numeroSocio && code === resumenMillas.usuario.numeroSocio.toUpperCase()) {
      setErrorCupon(`${code} es tu número de socio Cootranar, no un código de cupón. ¡Tus ${saldoMillas.toLocaleString('es-CO')} millas ya están cargadas en tu saldo arriba para pagar tu viaje directamente!`);
      return;
    }

    setValidandoCupon(true);
    setErrorCupon(null);
    try {
      const res = await millasApi.validarCupon(code);
      if (res.valido && res.codigoCupon) {
        setCuponAplicado({
          codigoCupon: res.codigoCupon,
          tipoDescuento: 'MONTO_FIJO',
          valor: res.valorDescuentoCop || 0,
          descripcion: res.titulo || 'Cupón de Millas',
          valorDescuentoCop: res.valorDescuentoCop || 0,
        });
        setCodigoCuponInput('');
      } else {
        setErrorCupon(res.mensaje || 'Cupón no válido o ya utilizado');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al validar cupón';
      setErrorCupon(msg);
    } finally {
      setValidandoCupon(false);
    }
  };

  const handleQuitarCupon = () => {
    setCuponAplicado(null);
    setErrorCupon(null);
  };

  const handleConfirmarConMillas = async () => {
    setErrorMsg(null);
    // Validar todos los formularios de pasajeros
    const nuevosErrores: Record<number, Record<string, string>> = {};
    let hayErrores = false;
    pasajeros.forEach((p, idx) => {
      const errs = validarPasajero(p);
      if (Object.keys(errs).length > 0) { nuevosErrores[idx] = errs; hayErrores = true; }
    });
    setErroresPasajeros(nuevosErrores);
    if (hayErrores) return;

    if (!puntosResueltos.idPuntoOrigen || !puntosResueltos.idPuntoDestino) return;

    if (!estaAutenticado) {
      navigate(ROUTES.LOGIN, { state: { returnTo: location.pathname } });
      return;
    }

    if (!tieneMillasSuficientes && totalAPagar > 0) {
      setErrorMsg(tm.saldoInsuficienteMillas);
      return;
    }

    setProcesandoMillas(true);
    try {
      const asientosDTO: AsientoCompraMillasDTO[] = asientosSeleccionados.map((asiento, idx) => ({
        idAsientoViaje: asiento.idasientoviaje,
        idPuntoOrigen: puntosResueltos.idPuntoOrigen!,
        idPuntoDestino: puntosResueltos.idPuntoDestino!,
        monto: asiento.precio,
        esComprador: idx === 0,
        nombrePasajero: pasajeros[idx].nombrePasajero,
        apellidoPasajero: pasajeros[idx].apellidoPasajero,
        tipoDocumento: pasajeros[idx].tipoDocumento,
        documento: pasajeros[idx].documento,
        telefono: pasajeros[idx].telefono || undefined,
        correoPasajero: pasajeros[idx].correoPasajero || undefined,
      }));

      const res = await millasApi.comprarViajeConMillas({
        idViaje: state!.idviaje,
        asientos: asientosDTO,
        codigoCupon: cuponAplicado?.codigoCupon,
        usarDescuentoMillas: true,
      });

      // Limpiar refs para evitar que el cleanup libere asientos ya comprados
      asientosReservadosRef.current.clear();
      asientosPendientesRef.current.clear();

      navigate(`${ROUTES.PAGO_RESULTADO}?status=APPROVED&reference=${res.referencia}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al procesar el canje de millas.';
      setErrorMsg(msg);
    } finally {
      setProcesandoMillas(false);
    }
  };

  // Bug 2 fix (parte 1): cuando el widget ya está activo, limpiar los refs para que
  // pagehide/desmontaje no libere asientos que ya forman parte de una transacción activa.
  useEffect(() => {
    if (fase !== 'widget') return;
    asientosReservadosRef.current.clear();
    asientosPendientesRef.current.clear();
  }, [fase]);

  // Bug 2 fix (parte 2): cuando el backend rechaza la preparación del pago (cualquier error,
  // incluyendo PASAJERO_YA_EN_VIAJE), liberar TODOS los asientos reservados de inmediato.
  useEffect(() => {
    if (fase !== 'error') return;
    const ids = Array.from(asientosReservadosRef.current);
    if (ids.length > 0) {
      asientosReservadosRef.current.clear();
      asientosPendientesRef.current.clear();
      ids.forEach(id => {
        httpClient.post(`/asientos/${id}/liberar`).catch(() => {});
      });
      setAsientos(prev => prev.map(a =>
        ids.includes(a.idasientoviaje) ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
      ));
      setAsientosSeleccionados([]);
      setPasajeros([]);
      setUsarMisDatosIdx(null);
      detenerCountdown();
    }
    // Mostrar el mensaje de error del backend en el banner de la página
    if (errorPago) setErrorMsg(errorPago.mensaje);

    // Resetear el hook de pago para permitir un nuevo intento
    resetear();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // Resetear la pasarela si el usuario deselecciona todos los asientos estando en fase de widget
  useEffect(() => {
    if (fase === 'widget' && asientosSeleccionados.length === 0) {
      resetear();
    }
  }, [fase, asientosSeleccionados.length, resetear]);

  // El widget de Wompi se renderiza inline via WompiCheckout cuando fase === 'widget'

  // --- Valores computados ---
  const precioTotal = asientosSeleccionados.reduce((sum, a) => sum + a.precio, 0);
  const descuentoCupon = cuponAplicado ? Math.min(precioTotal, cuponAplicado.valorDescuentoCop) : 0;
  const totalAPagar = Math.max(0, precioTotal - descuentoCupon);
  const valorMillaCop = configMillas?.valorMillaCop || 10;
  const millasRequeridas = Math.ceil(totalAPagar / valorMillaCop);
  const saldoMillas = resumenMillas?.saldoMillas || 0;
  const tieneMillasSuficientes = saldoMillas >= millasRequeridas;
  const numerosAsientos = asientosSeleccionados.map(a => a.numeroasiento).sort((a, b) => a - b);

  const formatCountdown = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!state?.idviaje) return null;

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-[#0e3a8c] dark:text-blue-400 animate-spin">progress_activity</span>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{s.cargando}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-sm">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-3 block">error</span>
            <p className="text-red-700 dark:text-red-400 font-medium mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="bg-[#0e3a8c] text-white px-6 py-2 rounded-xl font-bold text-sm">{s.volver}</button>
          </div>
        </div>
      </div>
    );
  }

  const imagenDestino = detalle?.imagendestino ?? busCootranar;

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 transition-colors duration-200" onClick={handleCloseSugerencias}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
          <button onClick={() => navigate(ROUTES.HOME)} className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors">{s.inicio}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => navigate(-1)} className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors">{s.resultados}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#0e3a8c] dark:text-blue-400 font-semibold">{s.titulo}</span>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-32 md:pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Panel izquierdo: Detalles del viaje */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-5 pb-3">
                <p className="text-xs font-bold text-[#0e3a8c] dark:text-blue-400 uppercase tracking-widest mb-1">{s.detallesViaje}</p>
                {state.rutaCompleta && <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{s.ruta}: {state.rutaCompleta}</p>}
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {state.origen}
                  <span className="material-symbols-outlined text-[#0e3a8c] text-xl">arrow_forward</span>
                  {state.destino}
                </h2>
              </div>
              <div className="relative mx-5 mb-4 rounded-xl overflow-hidden h-40">
                <img src={imagenDestino} alt={`Ciudad de ${state.destino}`} className="w-full h-full object-cover" />
                {detalle?.tipoBus.nombre && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-xs font-bold">{detalle.tipoBus.nombre}</span>
                  </div>
                )}
              </div>
              <div className="px-5 pb-5 space-y-4">
                <InfoItem icon="directions_bus" label={s.vehiculo} value={`${s.placa}: ${detalle?.vehiculo.placa ?? state.placa}\n${s.movil}: ${detalle?.vehiculo.numeromovil ?? state.movil}`} />
                {detalle?.tipoBus && <InfoItem icon="airline_seat_recline_normal" label={s.tipoBus} value={[detalle.tipoBus.nombre, detalle.tipoBus.descripcion].filter(Boolean).join('\n')} />}
                <InfoItem icon="schedule" label={s.itinerario} value={`${s.salida}: ${state.hora}\n${s.fecha}: ${state.fecha}`} />
                {detalle?.tipoServicio && <InfoItem icon="confirmation_number" label={s.tipoServicio} value={detalle.tipoServicio.nombre} />}
              </div>
            </div>
          </div>

          {/* Panel derecho: Selector de asientos + formularios */}
          <div className="flex-1 space-y-6">
            {/* Mapa de asientos */}
            <div id="mapa-asientos" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{s.seleccionaTusAsientos}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {LEYENDA.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {segundosRestantes !== null && (
                <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  segundosRestantes < 60
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}>
                  <span className="material-symbols-outlined text-base">timer</span>
                  {s.timerMsg} {formatCountdown(segundosRestantes)} {s.timerConfirma}
                </div>
              )}

              {detalle?.vehiculo.distribucionasientos ? (
                <SelectorAsientos distribucion={detalle.vehiculo.distribucionasientos} asientos={asientos} onSeleccionar={handleSeleccionar} />
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-4xl block mb-2">event_seat</span>
                  {s.errorMapaAsientos}
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Resumen de selección */}
              {asientosSeleccionados.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {asientosSeleccionados.length === 1
                          ? `1 ${s.asientoSeleccionado}`
                          : `${asientosSeleccionados.length} ${s.asientosSeleccionados}`}
                        <span className="text-slate-400 dark:text-slate-500 ml-1">({s.max} {MAX_ASIENTOS})</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.asientos}: {numerosAsientos.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      {cuponAplicado && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold line-through">
                          {precioTotal.toLocaleString('es-CO')} COP
                        </p>
                      )}
                      <p className="text-2xl font-extrabold text-[#0e3a8c] dark:text-blue-400">
                        {totalAPagar.toLocaleString('es-CO')} COP
                      </p>
                      {metodoPago === 'MILLAS' && (
                        <p className="text-xs font-bold text-[#c62828] dark:text-red-400 flex items-center justify-end gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-sm">stars</span>
                          {millasRequeridas.toLocaleString('es-CO')} Millas
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => document.getElementById('formularios-pasajeros')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center justify-center gap-2 bg-[#0e3a8c] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
                  >
                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                    {asientosSeleccionados.length > 1 ? s.confirmarAsientos : s.confirmarAsiento}
                  </button>
                </div>
              )}
              {asientosSeleccionados.length === 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center">{s.seleccionaParaContinuar}</p>
                </div>
              )}
            </div>

            {/* Panel de formularios de pasajeros (aparece cuando hay asientos seleccionados) */}
            {asientosSeleccionados.length > 0 && pasajeros.length === asientosSeleccionados.length && (
              <div id="formularios-pasajeros" className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{s.datosPasajeros}</h3>
                  <button
                    onClick={() => document.getElementById('mapa-asientos')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                    {s.volverAAsientos}
                  </button>
                </div>
                <div className="space-y-5">
                  {pasajeros.map((pasajero, idx) => {
                    const asiento = asientosSeleccionados[idx];
                    if (!asiento) return null;
                    return (
                      <PasajeroFormInline
                        key={`${asiento.idasientoviaje}-${idx}`}
                        index={idx}
                        asiento={asiento}
                        datos={pasajero}
                        errores={erroresPasajeros[idx] || {}}
                        sugerencias={sugerenciaActiva === idx ? (sugerencias[idx] || []) : []}
                        buscando={buscando[idx] || false}
                        usarMisDatos={usarMisDatosIdx === idx}
                        totalAsientos={asientosSeleccionados.length}
                        tiposDocumento={TIPOS_DOCUMENTO}
                        labels={s}
                        onToggleUsarMisDatos={(checked) => handleToggleUsarMisDatos(idx, checked)}
                        onChange={handleChangePasajero}
                        onBlur={handleBlurPasajero}
                        onSeleccionarSugerencia={seleccionarSugerencia}
                        onEliminar={() => handleEliminarAsientoDesdeFormulario(idx)}
                      />
                    );
                  })}
                </div>

                {/* ── SELECCIÓN DE MÉTODO DE PAGO ── */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#0e3a8c] dark:text-blue-400">payments</span>
                    {tm.metodoPago}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {/* Opción 1: Wompi */}
                    <button
                      type="button"
                      onClick={() => setMetodoPago('WOMPI')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        metodoPago === 'WOMPI'
                          ? 'border-2 border-[#0e3a8c] bg-blue-50/50 dark:bg-blue-900/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        metodoPago === 'WOMPI'
                          ? 'bg-[#0e3a8c] text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <span className="material-symbols-outlined text-xl">credit_card</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {tm.pagarConWompi}
                          </p>
                          {metodoPago === 'WOMPI' && (
                            <span className="material-symbols-outlined text-sm text-[#0e3a8c] dark:text-blue-400">check_circle</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Tarjeta de crédito, PSE, Nequi, Bancolombia
                        </p>
                      </div>
                    </button>

                    {/* Opción 2: Millas Cootranar */}
                    <button
                      type="button"
                      onClick={() => setMetodoPago('MILLAS')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        metodoPago === 'MILLAS'
                          ? 'border-2 border-[#c62828] bg-red-50/40 dark:bg-red-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        metodoPago === 'MILLAS'
                          ? 'bg-[#c62828] text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        <span className="material-symbols-outlined text-xl">stars</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {tm.pagarConMillas}
                          </p>
                          {metodoPago === 'MILLAS' && (
                            <span className="material-symbols-outlined text-sm text-[#c62828] dark:text-red-400">check_circle</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {cargandoMillas ? (
                            'Consultando saldo...'
                          ) : estaAutenticado ? (
                            `${(resumenMillas?.saldoMillas || 0).toLocaleString('es-CO')} millas disponibles`
                          ) : (
                            'Inicia sesión para canjear tus millas'
                          )}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Callout para iniciar sesión si no está autenticado */}
                  {!estaAutenticado && (
                    <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl shrink-0 mt-0.5">account_circle</span>
                        <div>
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            Inicia sesión para pagar con tus Millas
                          </p>
                          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            ¡No necesitas ningún código de cupón! Al iniciar sesión con tu cuenta, tus millas acumuladas se cargan automáticamente para pagar el viaje.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.LOGIN, { state: { returnTo: location.pathname } })}
                        className="px-4 py-2 bg-[#0e3a8c] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <span>Iniciar Sesión</span>
                        <span className="material-symbols-outlined text-xs">login</span>
                      </button>
                    </div>
                  )}

                  {/* Cupón de descuento */}
                  <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-amber-600">confirmation_number</span>
                        {tm.tengoCupon}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.MILLAS)}
                        className="text-[11px] text-[#0e3a8c] dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        <span>¿Dónde conseguir un código? Canjear en Club Millas</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                      (Opcional) Si canjeaste un bono o recompensa en el Club Millas, ingresa aquí tu cupón generado (ej: CTN-1-XYZ). Si ya tienes millas en tu cuenta, se descuentan directamente arriba sin necesidad de cupones.
                    </p>

                    {cuponAplicado && (
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={handleQuitarCupon}
                          className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer ml-auto"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                          {tm.quitarCupon}
                        </button>
                      </div>
                    )}

                    {!cuponAplicado ? (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={codigoCuponInput}
                            onChange={(e) => setCodigoCuponInput(e.target.value.toUpperCase())}
                            placeholder={tm.ingresarCupon}
                            className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#0e3a8c]/20"
                          />
                          <button
                            type="button"
                            disabled={!codigoCuponInput.trim() || validandoCupon}
                            onClick={() => handleAplicarCupon()}
                            className="px-4 py-2 bg-[#0e3a8c] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                          >
                            {validandoCupon && <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>}
                            <span>{tm.aplicarCupon}</span>
                          </button>
                        </div>
                        {errorCupon && <p className="text-xs text-red-500 mt-1.5">{errorCupon}</p>}

                        {/* Badges de cupones propios activos */}
                        {misCupones.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium">Tus cupones:</span>
                            {misCupones.map((c) => (
                              <button
                                key={c.idCanje}
                                type="button"
                                onClick={() => handleAplicarCupon(c.codigoCupon)}
                                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                              >
                                {c.codigoCupon} (-${(c.valorDescuentoCop || 0).toLocaleString('es-CO')} COP)
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                          <div>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                              {cuponAplicado.codigoCupon}
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              {cuponAplicado.descripcion} (-{descuentoCupon.toLocaleString('es-CO')} COP)
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                          -{descuentoCupon.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info detallada de pago con millas si está seleccionado */}
                  {metodoPago === 'MILLAS' && (
                    <div className="mb-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">{tm.tienesMillas}:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {saldoMillas.toLocaleString('es-CO')} pts
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">{tm.millasRequeridas}:</span>
                        <span className="font-black text-[#c62828] dark:text-red-400 text-sm">
                          {millasRequeridas.toLocaleString('es-CO')} pts
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          {tieneMillasSuficientes ? 'Saldo posterior estimado:' : 'Faltante:'}
                        </span>
                        <span className={`font-black ${tieneMillasSuficientes ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {tieneMillasSuficientes
                            ? `${(saldoMillas - millasRequeridas).toLocaleString('es-CO')} pts`
                            : `-${(millasRequeridas - saldoMillas).toLocaleString('es-CO')} pts`}
                        </span>
                      </div>

                      {!tieneMillasSuficientes && totalAPagar > 0 && (
                        <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                          <span className="material-symbols-outlined text-sm text-red-600 shrink-0 mt-0.5">warning</span>
                          <span>{tm.saldoInsuficienteMillas}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error de pago */}
                {fase === 'error' && errorPago && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                    <span>{errorPago.mensaje}</span>
                  </div>
                )}

                {/* Botón confirmar según método o Widget Wompi */}
                <div className="mt-6">
                  {metodoPago === 'WOMPI' ? (
                    fase === 'widget' && datosTransaccion ? (
                      <WompiCheckout key={datosTransaccion.referencia} datos={datosTransaccion} onCerrar={resetear} />
                    ) : (
                      <button
                        onClick={handleConfirmarYPagar}
                        disabled={!formularioValido() || fase === 'verificando' || fase === 'preparando'}
                        className="w-full flex items-center justify-center gap-2 bg-[#0e3a8c] text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {(fase === 'verificando' || fase === 'preparando') ? (
                          <>
                            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                            {s.procesando}
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">payment</span>
                            {s.confirmarYPagar} — {totalAPagar.toLocaleString('es-CO')} COP
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleConfirmarConMillas}
                      disabled={!formularioValido() || (!tieneMillasSuficientes && totalAPagar > 0) || procesandoMillas}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c62828] to-[#b71c1c] text-white px-6 py-4 rounded-2xl font-bold text-sm hover:from-red-800 hover:to-red-900 transition-all shadow-lg shadow-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {procesandoMillas ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          {tm.procesandoCanje}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">stars</span>
                          {tm.canjearYConfirmar} — {millasRequeridas.toLocaleString('es-CO')} Millas
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Formulario completar perfil
           Solo se muestra como fallback cuando el usuario NO marcó "Yo soy este pasajero".
           Si sí lo marcó (usarMisDatosIdx !== null), el perfil ya se completó
           automáticamente en handleConfirmarYPagar antes de llamar iniciarPago. */}
      {fase === 'formulario' && usarMisDatosIdx === null && (
        <FormularioCompletarPerfil
          onCompletado={completarPerfil}
          errorExterno={errorPago?.mensaje ?? null}
        />
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg shrink-0">
        <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        {value.split('\n').map((line, i) => (
          <p key={i} className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">{line}</p>
        ))}
      </div>
    </div>
  );
}

interface PasajeroFormInlineProps {
  index: number;
  asiento: AsientoSeleccionadoInfo;
  datos: DatosPasajero;
  errores: Record<string, string>;
  sugerencias: PasajeroSugerencia[];
  buscando: boolean;
  usarMisDatos: boolean;
  totalAsientos: number;
  tiposDocumento: { value: string; label: string }[];
  labels: {
    pasajero: string; comprador: string; asiento: string;
    yoSoyEstePasajero: string; nombre: string; apellido: string;
    tipoDoc: string; documento: string; telefono: string; correo: string;
    nombrePlaceholder: string; apellidoPlaceholder: string;
    documentoPlaceholder: string; telefonoPlaceholder: string; correoPlaceholder: string;
    buscando: string; eliminarAsiento: string;
  };
  onToggleUsarMisDatos: (checked: boolean) => void;
  onChange: (index: number, campo: keyof DatosPasajero, valor: string) => void;
  onBlur: (index: number) => void;
  onSeleccionarSugerencia: (index: number, sugerencia: PasajeroSugerencia) => void;
  onEliminar: () => void;
}

function PasajeroFormInline({ index, asiento, datos, errores, sugerencias, buscando, usarMisDatos, totalAsientos, tiposDocumento, labels, onToggleUsarMisDatos, onChange, onBlur, onSeleccionarSugerencia, onEliminar }: PasajeroFormInlineProps) {
  return (
    <div className="relative border border-slate-100 dark:border-slate-700 rounded-xl p-4 dark:bg-slate-800/50">
      {/* Botón X para eliminar asiento (solo visible si hay más de 1 asiento seleccionado) */}
      {totalAsientos > 1 && (
        <button
          type="button"
          onClick={onEliminar}
          title={labels.eliminarAsiento}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 transition-all duration-150 z-10"
        >
          <span className="material-symbols-outlined text-sm leading-none">close</span>
        </button>
      )}
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0e3a8c] text-white rounded-lg flex items-center justify-center font-bold text-xs">
            {asiento.numeroasiento}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {labels.pasajero} {index + 1}
              {datos.esComprador && <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-[#0e3a8c] dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">{labels.comprador}</span>}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{labels.asiento} #{asiento.numeroasiento} · {asiento.precio.toLocaleString('es-CO')} COP</p>
          </div>
        </div>
      </div>

      {/* Toggle "Yo soy este pasajero" */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={usarMisDatos}
          onChange={(e) => onToggleUsarMisDatos(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#0e3a8c] focus:ring-[#0e3a8c]"
        />
        <span className="text-sm text-slate-600 dark:text-slate-300">{labels.yoSoyEstePasajero}</span>
      </label>

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CampoTexto label={labels.nombre} value={datos.nombrePasajero} error={errores.nombrePasajero} placeholder={labels.nombrePlaceholder} onChange={(v) => onChange(index, 'nombrePasajero', v)} onBlur={() => onBlur(index)} />
        <CampoTexto label={labels.apellido} value={datos.apellidoPasajero} error={errores.apellidoPasajero} placeholder={labels.apellidoPlaceholder} onChange={(v) => onChange(index, 'apellidoPasajero', v)} onBlur={() => onBlur(index)} />
        <CampoSelect label={labels.tipoDoc} value={datos.tipoDocumento} error={errores.tipoDocumento} options={tiposDocumento} onChange={(v) => onChange(index, 'tipoDocumento', v)} onBlur={() => onBlur(index)} />
        <div className="relative">
          <CampoTexto label={labels.documento} value={datos.documento} error={errores.documento} placeholder={labels.documentoPlaceholder} onChange={(v) => onChange(index, 'documento', v)} onBlur={() => onBlur(index)} />
          {sugerencias.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {sugerencias.map((s, i) => (
                <button key={i} type="button" className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-b-0" onClick={() => onSeleccionarSugerencia(index, s)}>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.nombre} {s.apellido}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{s.tipoDocumento} {s.documento}</p>
                </button>
              ))}
            </div>
          )}
          {buscando && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg px-4 py-3">
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                {labels.buscando}
              </p>
            </div>
          )}
        </div>
        <CampoTexto label={labels.telefono} value={datos.telefono} placeholder={labels.telefonoPlaceholder} onChange={(v) => onChange(index, 'telefono', v)} onBlur={() => onBlur(index)} />
        <CampoTexto label={labels.correo} value={datos.correoPasajero} placeholder={labels.correoPlaceholder} onChange={(v) => onChange(index, 'correoPasajero', v)} onBlur={() => onBlur(index)} />
      </div>
    </div>
  );
}

function CampoTexto({ label, value, error, placeholder, onChange, onBlur }: { label: string; value: string; error?: string; placeholder?: string; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className={`w-full bg-[#f0f2f5] dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 font-medium outline-none transition-all focus:ring-2 focus:ring-[#0e3a8c]/20 focus:bg-white dark:focus:bg-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${error ? 'ring-2 ring-red-300 bg-red-50 dark:bg-red-900/20' : ''}`} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function CampoSelect({ label, value, error, options, onChange, onBlur }: { label: string; value: string; error?: string; options: { value: string; label: string }[]; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className={`w-full bg-[#f0f2f5] dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 font-medium outline-none transition-all focus:ring-2 focus:ring-[#0e3a8c]/20 focus:bg-white dark:focus:bg-slate-600 appearance-none ${error ? 'ring-2 ring-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
