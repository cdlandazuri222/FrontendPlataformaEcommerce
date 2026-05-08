import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { SelectorAsientos, type AsientoConEstado, type EstadoAsiento } from '../../components/common/SelectorAsientos';
import { ROUTES } from '../../../shared/constants';
import { httpClient } from '../../../infrastructure/api/httpClient';
import { useAsientosRealtime } from '../../hooks/useAsientosRealtime';
import { useWompiPago } from '../../hooks/useWompiPago';
import { FormularioCompletarPerfil } from '../../components/pago/FormularioCompletarPerfil';
import { WompiCheckout } from '../../components/pago/WompiCheckout';
import busCootranar from '../../../assets/busCootranar.png';


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

  const [detalle, setDetalle] = useState<DetalleViaje | null>(null);
  const [asientos, setAsientos] = useState<AsientoConEstado[]>([]);
  const [tiempoMaxMin, setTiempoMaxMin] = useState(15);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<AsientoConEstado | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [puntosResueltos, setPuntosResueltos] = useState<{ idPuntoOrigen: number | null; idPuntoDestino: number | null }>({
    idPuntoOrigen: null,
    idPuntoDestino: null
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const asientoReservadoRef = useRef<number | null>(null);

  const asientoPendienteRef = useRef<number | null>(null);

  const { fase: fasePago, datosTransaccion, error: errorPago, iniciarPago, completarPerfil, resetear: resetearPago } = useWompiPago();

  useEffect(() => {
    if (!state?.idviaje) navigate(ROUTES.HOME, { replace: true });
  }, [state, navigate]);

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
            console.log('[SeleccionAsientos] Puntos resueltos:', { idPuntoOrigen, idPuntoDestino });
          } catch { /* si falla, continuar sin puntos */ }
        }

        // Guardar los puntos resueltos en el estado
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

  
  const handleCambioRealtime = useCallback((idasientoviaje: number, nuevoEstado: EstadoAsiento) => {
  
    if (idasientoviaje === asientoPendienteRef.current && nuevoEstado === 'RESERVADO') {
      asientoPendienteRef.current = null;
      setAsientos(prev => prev.map(a =>
        a.idasientoviaje === idasientoviaje ? { ...a, estado: 'SELECCIONADO' as EstadoAsiento } : a
      ));
      return;
    }
    // Para el asiento ya confirmado como propio, no sobreescribir con RESERVADO de Supabase
    if (idasientoviaje === asientoReservadoRef.current) return;
    // Para otros asientos, actualizar normalmente
    setAsientos(prev => prev.map(a =>
      a.idasientoviaje === idasientoviaje ? { ...a, estado: nuevoEstado } : a
    ));
  }, []);

  useAsientosRealtime(
    state?.idviaje ?? null,
    asientoReservadoRef.current,
    handleCambioRealtime
  );

  useEffect(() => {
    if (!state?.idviaje || !puntosResueltos.idPuntoOrigen || !puntosResueltos.idPuntoDestino) return;

    const intervalo = setInterval(async () => {
      try {
        const res = await httpClient.get<{ data: AsientosResponse }>(
          `/plataforma-ecommerce/viaje/${state.idviaje}/asientos`,
          { params: { idPuntoOrigen: puntosResueltos.idPuntoOrigen, idPuntoDestino: puntosResueltos.idPuntoDestino } }
        );
        const nuevos = res.data.data.asientos;
        // Actualizar solo asientos que no son el seleccionado por el usuario
        setAsientos(prev => prev.map(a => {
          if (a.idasientoviaje === asientoReservadoRef.current) return a;
          const actualizado = nuevos.find(n => n.idasientoviaje === a.idasientoviaje);
          return actualizado ?? a;
        }));
      } catch { /* silencioso */ }
    }, 30000);

    return () => clearInterval(intervalo);
  }, [state?.idviaje, puntosResueltos.idPuntoOrigen, puntosResueltos.idPuntoDestino]);
  const liberarAsientoActual = useCallback(async () => {
    const id = asientoReservadoRef.current;
    if (!id) return;
    asientoReservadoRef.current = null;
    try {
      await httpClient.post(`/asientos/${id}/liberar`);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    const handleUnload = () => liberarAsientoActual();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      liberarAsientoActual();
    };
  }, [liberarAsientoActual]);

  // Countdown del timer de reserva
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
        // Capturar el id antes de limpiar la ref
        const idExpirado = asientoReservadoRef.current;
        asientoReservadoRef.current = null;
        setAsientoSeleccionado(null);
        if (idExpirado) {
          setAsientos(prev => prev.map(a =>
            a.idasientoviaje === idExpirado ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
          ));
          httpClient.post(`/asientos/${idExpirado}/liberar`).catch(() => { /* silencioso */ });
        }
      }
    }, 1000);
  }, []);

  const detenerCountdown = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setSegundosRestantes(null);
  }, []);

  // Seleccionar asiento
  const handleSeleccionar = async (asiento: AsientoConEstado) => {
    setErrorMsg(null);

    const esMismoAsiento = asientoReservadoRef.current === asiento.idasientoviaje
      || asiento.estado === 'SELECCIONADO';

    // Deseleccionar si es el mismo
    if (esMismoAsiento) {
      const idLiberar = asientoReservadoRef.current ?? asiento.idasientoviaje;
      asientoReservadoRef.current = null;
      asientoPendienteRef.current = null;
      detenerCountdown();
      setAsientoSeleccionado(null);
      setAsientos(prev => prev.map(a =>
        a.idasientoviaje === idLiberar ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
      ));
      try { await httpClient.post(`/asientos/${idLiberar}/liberar`); } catch { /* silencioso */ }
      return;
    }

    // Si hay otro asiento reservado, liberarlo en background
    if (asientoReservadoRef.current) {
      const idAnterior = asientoReservadoRef.current;
      asientoReservadoRef.current = null;
      asientoPendienteRef.current = null;
      detenerCountdown();
      setAsientos(prev => prev.map(a =>
        a.idasientoviaje === idAnterior ? { ...a, estado: 'LIBRE' as EstadoAsiento } : a
      ));
      httpClient.post(`/asientos/${idAnterior}/liberar`).catch(() => { /* silencioso */ });
    }

    // Marcar como pendiente — NO pintar todavía.
    // El color SELECCIONADO aparecerá cuando llegue el evento de Supabase,
    // exactamente al mismo tiempo que taquilla ve el color RESERVADO.
    asientoPendienteRef.current = asiento.idasientoviaje;
    // Guardar para habilitar el botón "Confirmar" y el countdown
    setAsientoSeleccionado({ ...asiento, estado: 'SELECCIONADO' as EstadoAsiento });

    // Reservar en backend
    try {
      await httpClient.post(`/asientos/${asiento.idasientoviaje}/reservar`);
      asientoReservadoRef.current = asiento.idasientoviaje;
      iniciarCountdown(tiempoMaxMin);
      // El color verde aparecerá cuando llegue el evento de Supabase (handleCambioRealtime)
    } catch (err: any) {
      // Revertir si falla
      asientoPendienteRef.current = null;
      setAsientoSeleccionado(null);
      const msg = err?.response?.data?.message ?? 'El asiento ya no está disponible';
      setErrorMsg(msg);
      if (puntosResueltos.idPuntoOrigen && puntosResueltos.idPuntoDestino) {
        try {
          const res = await httpClient.get<{ data: AsientosResponse }>(
            `/plataforma-ecommerce/viaje/${state?.idviaje}/asientos`,
            { params: { idPuntoOrigen: puntosResueltos.idPuntoOrigen, idPuntoDestino: puntosResueltos.idPuntoDestino } }
          );
          setAsientos(res.data.data.asientos);
        } catch { /* silencioso */ }
      }
    }
  };

  // Precio del asiento seleccionado
  const precioFinal = asientoSeleccionado?.precio ?? state?.precio ?? null;

  // Formatear countdown
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
            <button onClick={() => navigate(-1)} className="bg-[#0e3a8c] text-white px-6 py-2 rounded-xl font-bold text-sm">
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const imagenDestino = detalle?.imagendestino ?? busCootranar;

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
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
                {state.rutaCompleta && (
                  <p className="text-[10px] text-slate-400 mb-0.5">Ruta: {state.rutaCompleta}</p>
                )}
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                  {state.origen}
                  <span className="material-symbols-outlined text-[#0e3a8c] text-xl">arrow_forward</span>
                  {state.destino}
                </h2>
              </div>

              {/* Imagen */}
              <div className="relative mx-5 mb-4 rounded-xl overflow-hidden h-40">
                <img src={imagenDestino} alt={`Ciudad de ${state.destino}`} className="w-full h-full object-cover" />
                {detalle?.tipoBus.nombre && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-xs font-bold">{detalle.tipoBus.nombre}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-5 pb-5 space-y-4">
                <InfoItem icon="directions_bus" label="Vehículo" value={[
                  `Placa: ${detalle?.vehiculo.placa ?? state.placa}`,
                  `Móvil: ${detalle?.vehiculo.numeromovil ?? state.movil} (identificador interno, no teléfono)`
                ].join('\n')} />
                {detalle?.tipoBus && (
                  <InfoItem icon="airline_seat_recline_normal" label="Tipo de Bus"
                    value={[detalle.tipoBus.nombre, detalle.tipoBus.descripcion].filter(Boolean).join('\n')} />
                )}
                <InfoItem icon="schedule" label="Itinerario" value={`Salida: ${state.hora}\nFecha: ${state.fecha}`} />
                {detalle?.tipoServicio && (
                  <InfoItem icon="confirmation_number" label="Tipo de Servicio" value={detalle.tipoServicio.nombre} />
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho: Selector de asientos */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
              {/* Encabezado con leyenda */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-extrabold text-slate-800">Selecciona tu asiento</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {LEYENDA.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Countdown */}
              {segundosRestantes !== null && (
                <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  segundosRestantes < 60 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className="material-symbols-outlined text-base">timer</span>
                  Asiento reservado por compra por {formatCountdown(segundosRestantes)} — confirma antes de que expire
                </div>
              )}

              {/* Mapa de asientos */}
              {detalle?.vehiculo.distribucionasientos ? (
                <SelectorAsientos
                  distribucion={detalle.vehiculo.distribucionasientos}
                  asientos={asientos}
                  onSeleccionar={handleSeleccionar}
                />
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl block mb-2">event_seat</span>
                  No se pudo cargar el mapa de asientos
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Error de pago */}
              {fasePago === 'error' && errorPago && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{errorPago}</span>
                </div>
              )}

              {/* Widget Wompi */}
              {fasePago === 'widget' && datosTransaccion && (
                <div className="mt-4">
                  <WompiCheckout key={datosTransaccion.referencia} datos={datosTransaccion} />
                </div>
              )}

              {/* Footer: precio y botón */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {asientoSeleccionado ? (
                    <>
                      <p className="text-sm text-slate-500">
                        Asiento <span className="font-bold text-slate-700">{asientoSeleccionado.numeroasiento}</span>
                        {asientoSeleccionado.espoltrona && <span className="ml-1 text-amber-500">★ Poltrona</span>}
                      </p>
                      <p className="text-2xl font-extrabold text-[#0e3a8c]">
                        {precioFinal != null
                          ? `$${precioFinal.toLocaleString('es-CO')} COP`
                          : 'CONSULTAR'}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Selecciona un asiento disponible</p>
                  )}
                </div>

                <button
                  disabled={!asientoSeleccionado || fasePago === 'preparando' || fasePago === 'verificando'}
                  onClick={() => {
                    console.log('[DEBUG] Click en Confirmar asiento');
                    console.log('[DEBUG] asientoSeleccionado:', asientoSeleccionado);
                    console.log('[DEBUG] puntosResueltos:', puntosResueltos);
                    if (!asientoSeleccionado || !puntosResueltos.idPuntoOrigen || !puntosResueltos.idPuntoDestino) {
                      console.error('[DEBUG] Faltan datos:', { 
                        asientoSeleccionado: !!asientoSeleccionado, 
                        idPuntoOrigen: puntosResueltos.idPuntoOrigen, 
                        idPuntoDestino: puntosResueltos.idPuntoDestino 
                      });
                      return;
                    }
                    resetearPago();
                    iniciarPago({
                      idAsientoViaje: asientoSeleccionado.idasientoviaje,
                      idPuntoOrigen: puntosResueltos.idPuntoOrigen,
                      idPuntoDestino: puntosResueltos.idPuntoDestino,
                      idViaje: state.idviaje,
                      monto: precioFinal ?? 0
                    });
                  }}
                  className="flex items-center gap-2 bg-[#0e3a8c] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  <span className="material-symbols-outlined text-base">
                    {fasePago === 'preparando' || fasePago === 'verificando' ? 'progress_activity' : 'check_circle'}
                  </span>
                  {fasePago === 'preparando' || fasePago === 'verificando' ? 'Procesando...' : 'Confirmar asiento'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal: Formulario completar perfil */}
      {fasePago === 'formulario' && (
        <FormularioCompletarPerfil
          onCompletado={completarPerfil}
          errorExterno={errorPago}
        />
      )}
    </div>
  );
}

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
