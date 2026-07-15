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

const MAX_ASIENTOS = 10;

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
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

const LEYENDA = [
  { label: 'Disponible',  color: 'bg-white border-2 border-slate-200' },
  { label: 'Vendido',     color: 'bg-[#0e3a8c]' },
  { label: 'Reservado',   color: 'bg-yellow-400' },
  { label: 'Seleccionado',color: 'bg-green-500' },
];


export function SeleccionAsientosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

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
      setErrorMsg(`Puedes seleccionar máximo ${MAX_ASIENTOS} asientos por compra.`);
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
  const numerosAsientos = asientosSeleccionados.map(a => a.numeroasiento).sort((a, b) => a - b);

  const formatCountdown = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!state?.idviaje) return null;

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f6f6f8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-[#0e3a8c] animate-spin">progress_activity</span>
            <p className="mt-4 text-slate-500 font-medium">Cargando asientos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f6f8]">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-sm">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-3 block">error</span>
            <p className="text-red-700 font-medium mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="bg-[#0e3a8c] text-white px-6 py-2 rounded-xl font-bold text-sm">Volver</button>
          </div>
        </div>
      </div>
    );
  }

  const imagenDestino = detalle?.imagendestino ?? busCootranar;

  return (
    <div className="min-h-screen bg-[#f6f6f8]" onClick={handleCloseSugerencias}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <button onClick={() => navigate(ROUTES.HOME)} className="hover:text-[#0e3a8c] transition-colors">Inicio</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => navigate(-1)} className="hover:text-[#0e3a8c] transition-colors">Resultados</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#0e3a8c] font-semibold">Selección de Asientos</span>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-32 md:pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Panel izquierdo: Detalles del viaje */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 pb-3">
                <p className="text-xs font-bold text-[#0e3a8c] uppercase tracking-widest mb-1">Detalles del Viaje</p>
                {state.rutaCompleta && <p className="text-[10px] text-slate-400 mb-0.5">Ruta: {state.rutaCompleta}</p>}
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
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
                <InfoItem icon="directions_bus" label="Vehículo" value={`Placa: ${detalle?.vehiculo.placa ?? state.placa}\nMóvil: ${detalle?.vehiculo.numeromovil ?? state.movil}`} />
                {detalle?.tipoBus && <InfoItem icon="airline_seat_recline_normal" label="Tipo de Bus" value={[detalle.tipoBus.nombre, detalle.tipoBus.descripcion].filter(Boolean).join('\n')} />}
                <InfoItem icon="schedule" label="Itinerario" value={`Salida: ${state.hora}\nFecha: ${state.fecha}`} />
                {detalle?.tipoServicio && <InfoItem icon="confirmation_number" label="Tipo de Servicio" value={detalle.tipoServicio.nombre} />}
              </div>
            </div>
          </div>

          {/* Panel derecho: Selector de asientos + formularios */}
          <div className="flex-1 space-y-6">
            {/* Mapa de asientos */}
            <div id="mapa-asientos" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-extrabold text-slate-800">Selecciona tus asientos</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {LEYENDA.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {segundosRestantes !== null && (
                <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  segundosRestantes < 60 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className="material-symbols-outlined text-base">timer</span>
                  Asientos reservados por {formatCountdown(segundosRestantes)} — confirma antes de que expire
                </div>
              )}

              {detalle?.vehiculo.distribucionasientos ? (
                <SelectorAsientos distribucion={detalle.vehiculo.distribucionasientos} asientos={asientos} onSeleccionar={handleSeleccionar} />
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl block mb-2">event_seat</span>
                  No se pudo cargar el mapa de asientos
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Resumen de selección */}
              {asientosSeleccionados.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500">
                        {asientosSeleccionados.length === 1 ? '1 asiento seleccionado' : `${asientosSeleccionados.length} asientos seleccionados`}
                        <span className="text-slate-400 ml-1">(máx. {MAX_ASIENTOS})</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Asientos: {numerosAsientos.join(', ')}</p>
                    </div>
                    <p className="text-2xl font-extrabold text-[#0e3a8c]">{precioTotal.toLocaleString('es-CO')} COP</p>
                  </div>
                  <button
                    onClick={() => document.getElementById('formularios-pasajeros')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center justify-center gap-2 bg-[#0e3a8c] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
                  >
                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                    Confirmar asiento{asientosSeleccionados.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
              {asientosSeleccionados.length === 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-sm text-slate-400 text-center">Selecciona uno o más asientos disponibles para continuar</p>
                </div>
              )}
            </div>

            {/* Panel de formularios de pasajeros (aparece cuando hay asientos seleccionados) */}
            {asientosSeleccionados.length > 0 && pasajeros.length === asientosSeleccionados.length && (
              <div id="formularios-pasajeros" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-800">Datos de Pasajeros</h3>
                  <button
                    onClick={() => document.getElementById('mapa-asientos')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0e3a8c] transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                    Volver a asientos
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
                        onToggleUsarMisDatos={(checked) => handleToggleUsarMisDatos(idx, checked)}
                        onChange={handleChangePasajero}
                        onBlur={handleBlurPasajero}
                        onSeleccionarSugerencia={seleccionarSugerencia}
                        onEliminar={() => handleEliminarAsientoDesdeFormulario(idx)}
                      />
                    );
                  })}
                </div>

                {/* Error de pago */}
                {fase === 'error' && errorPago && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                    <span>{errorPago.mensaje}</span>
                  </div>
                )}

                {/* Widget Wompi */}
                {fase === 'widget' && datosTransaccion && (
                  <div className="mt-4">
                    <WompiCheckout key={datosTransaccion.referencia} datos={datosTransaccion} onCerrar={resetear} />
                  </div>
                )}

                {/* Botón confirmar y pagar */}
                <div className="mt-6">
                  <button
                    onClick={handleConfirmarYPagar}
                    disabled={!formularioValido() || fase === 'verificando' || fase === 'preparando'}
                    className="w-full flex items-center justify-center gap-2 bg-[#0e3a8c] text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {(fase === 'verificando' || fase === 'preparando') ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">payment</span>
                        Confirmar y Pagar — {precioTotal.toLocaleString('es-CO')} COP
                      </>
                    )}
                  </button>
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
      <div className="bg-slate-100 p-2 rounded-lg shrink-0">
        <span className="material-symbols-outlined text-[#0e3a8c] text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        {value.split('\n').map((line, i) => (
          <p key={i} className="text-sm text-slate-700 font-medium leading-snug">{line}</p>
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
  onToggleUsarMisDatos: (checked: boolean) => void;
  onChange: (index: number, campo: keyof DatosPasajero, valor: string) => void;
  onBlur: (index: number) => void;
  onSeleccionarSugerencia: (index: number, sugerencia: PasajeroSugerencia) => void;
  onEliminar: () => void;
}

function PasajeroFormInline({ index, asiento, datos, errores, sugerencias, buscando, usarMisDatos, totalAsientos, onToggleUsarMisDatos, onChange, onBlur, onSeleccionarSugerencia, onEliminar }: PasajeroFormInlineProps) {
  return (
    <div className="relative border border-slate-100 rounded-xl p-4">
      {/* Botón X para eliminar asiento (solo visible si hay más de 1 asiento seleccionado) */}
      {totalAsientos > 1 && (
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar este asiento"
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 transition-all duration-150 z-10"
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
            <p className="text-sm font-bold text-slate-800">
              Pasajero {index + 1}
              {datos.esComprador && <span className="ml-2 text-xs bg-blue-100 text-[#0e3a8c] px-2 py-0.5 rounded-full font-semibold">Comprador</span>}
            </p>
            <p className="text-xs text-slate-400">Asiento #{asiento.numeroasiento} · {asiento.precio.toLocaleString('es-CO')} COP</p>
          </div>
        </div>
      </div>

      {/* Toggle "Yo soy este pasajero" */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={usarMisDatos}
          onChange={(e) => onToggleUsarMisDatos(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-[#0e3a8c] focus:ring-[#0e3a8c]"
        />
        <span className="text-sm text-slate-600">Yo soy este pasajero</span>
      </label>

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CampoTexto label="Nombre *" value={datos.nombrePasajero} error={errores.nombrePasajero} placeholder="Nombre" onChange={(v) => onChange(index, 'nombrePasajero', v)} onBlur={() => onBlur(index)} />
        <CampoTexto label="Apellido *" value={datos.apellidoPasajero} error={errores.apellidoPasajero} placeholder="Apellido" onChange={(v) => onChange(index, 'apellidoPasajero', v)} onBlur={() => onBlur(index)} />
        <CampoSelect label="Tipo Doc *" value={datos.tipoDocumento} error={errores.tipoDocumento} options={TIPOS_DOCUMENTO} onChange={(v) => onChange(index, 'tipoDocumento', v)} onBlur={() => onBlur(index)} />
        <div className="relative">
          <CampoTexto label="Documento *" value={datos.documento} error={errores.documento} placeholder="Número de documento" onChange={(v) => onChange(index, 'documento', v)} onBlur={() => onBlur(index)} />
          {sugerencias.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {sugerencias.map((s, i) => (
                <button key={i} type="button" className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0" onClick={() => onSeleccionarSugerencia(index, s)}>
                  <p className="text-sm font-medium text-slate-700">{s.nombre} {s.apellido}</p>
                  <p className="text-xs text-slate-400">{s.tipoDocumento} {s.documento}</p>
                </button>
              ))}
            </div>
          )}
          {buscando && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Buscando...
              </p>
            </div>
          )}
        </div>
        <CampoTexto label="Teléfono" value={datos.telefono} placeholder="Teléfono (opcional)" onChange={(v) => onChange(index, 'telefono', v)} onBlur={() => onBlur(index)} />
        <CampoTexto label="Correo" value={datos.correoPasajero} placeholder="Correo (opcional)" onChange={(v) => onChange(index, 'correoPasajero', v)} onBlur={() => onBlur(index)} />
      </div>
    </div>
  );
}

function CampoTexto({ label, value, error, placeholder, onChange, onBlur }: { label: string; value: string; error?: string; placeholder?: string; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className={`w-full bg-[#f0f2f5] rounded-xl px-3 py-2.5 text-sm text-slate-700 font-medium outline-none transition-all focus:ring-2 focus:ring-[#0e3a8c]/20 focus:bg-white ${error ? 'ring-2 ring-red-300 bg-red-50' : ''}`} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function CampoSelect({ label, value, error, options, onChange, onBlur }: { label: string; value: string; error?: string; options: { value: string; label: string }[]; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className={`w-full bg-[#f0f2f5] rounded-xl px-3 py-2.5 text-sm text-slate-700 font-medium outline-none transition-all focus:ring-2 focus:ring-[#0e3a8c]/20 focus:bg-white appearance-none ${error ? 'ring-2 ring-red-300 bg-red-50' : ''}`}>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
