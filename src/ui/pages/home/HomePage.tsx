import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { TarjetaViaje } from '../../components/common/TarjetaViaje';
import { ComboboxCiudades, type OpcionCombobox } from '../../components/common/ComboboxCiudades';
import { plataformaEcommerceApi, type CiudadOrigen, type OpcionDestino, type ViajesQuery } from '../../../infrastructure/api/plataformaEcommerceApi';
import { useViajesHome } from '../../hooks/useViajesHome';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useTourBusqueda } from '../../hooks/useTourBusqueda';

const HERO_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL9CDZ1831IyzczCQmtcRHIOUvk9Ak8Y0esr_34Rumk_jCH2l0pi2r9lp5BXCBI6L_o76IRAr1Wd_8Y-DKTp2A-koAiZ_SJWXWDXGL7R2lsXT7BbaHkyfh5uQsS29jYLjJE9HkCbjXwFBEwKRUA6jvCyhO1vJcBQyGa8XShx39wOKcF2M_Kp7Juo1M21J8J14KlHGHy5kTyLMunFBLFNMNqdX-CUgoMNJQE_FDLJsqPL6E7HinbTmbbOp4-yxBrVikcZomcDnoayVs';


function ciudadOrigenToOpcion(c: CiudadOrigen): OpcionCombobox {
  return { id: c.idciudad, nombre: c.nombre, tipo: 'ciudad' };
}

function opcionDestinoToCombobox(o: OpcionDestino): OpcionCombobox {
  return { id: o.id, nombre: o.nombre, tipo: o.tipo };
}

function hoyISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}


export function HomePage() {
  const { tx, idioma } = usePreferencias();
  const h = tx.home;
  const { iniciarTour } = useTourBusqueda();

  const [origenSeleccionado, setOrigenSeleccionado] = useState<OpcionCombobox | null>(null);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState<OpcionCombobox | null>(null);
  const [origenTexto, setOrigenTexto] = useState('');
  const [destinoTexto, setDestinoTexto] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaError, setFechaError] = useState('');

  const [filtrosActivos, setFiltrosActivos] = useState<ViajesQuery>({});


  const { viajesHoy, viajesProgramados, loading, error, refetch } = useViajesHome(filtrosActivos);

  const [ciudadesOrigen, setCiudadesOrigen] = useState<OpcionCombobox[]>([]);
  const [opcionesDestino, setOpcionesDestino] = useState<OpcionCombobox[]>([]);
  const [loadingOrigen, setLoadingOrigen] = useState(false);
  const [loadingDestino, setLoadingDestino] = useState(false);

  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [horaSalida, setHoraSalida] = useState('Mañana');
  const [tipoBus, setTipoBus] = useState('');
  const [precioMax, setPrecioMax] = useState(150000);

  useEffect(() => {
    setLoadingOrigen(true);
    plataformaEcommerceApi
      .getCiudadesOrigen()
      .then((data) => setCiudadesOrigen(data.map(ciudadOrigenToOpcion)))
      .catch(() => {/* silently fall back to empty list */})
      .finally(() => setLoadingOrigen(false));
  }, []);


  useEffect(() => {
    setLoadingDestino(true);
    const origenId = origenSeleccionado?.id;
    plataformaEcommerceApi
      .getCiudadesDestino(origenId)
      .then((data) => setOpcionesDestino(data.map(opcionDestinoToCombobox)))
      .catch(() => setOpcionesDestino([]))
      .finally(() => setLoadingDestino(false));
  }, [origenSeleccionado]);


  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFecha(val);
    if (val && val < hoyISO()) {
      setFechaError(idioma === 'es' ? 'La fecha no puede ser anterior a hoy' : 'The date cannot be before today');
    } else {
      setFechaError('');
    }
  };

  const handleOrigenSelect = useCallback((opcion: OpcionCombobox | null) => {
    setOrigenSeleccionado(opcion);
    setDestinoSeleccionado(null);
    setDestinoTexto('');
  }, []);

  const handleDestinoSelect = useCallback((opcion: OpcionCombobox | null) => {
    setDestinoSeleccionado(opcion);
  }, []);

  const limpiarFiltros = () => {
    setOrigenSeleccionado(null);
    setDestinoSeleccionado(null);
    setOrigenTexto('');
    setDestinoTexto('');
    setFecha('');
    setFechaError('');
    setHoraSalida('');
    setTipoBus('');
    setPrecioMax(150000);
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (fecha && fecha < hoyISO()) {
      setFechaError(idioma === 'es' ? 'La fecha no puede ser anterior a hoy' : 'The date cannot be before today');
      return;
    }
    setFiltrosActivos({
      origen: origenSeleccionado?.nombre,
      destino: destinoSeleccionado?.nombre,
      destinoTipo: destinoSeleccionado?.tipo,
      fecha: fecha || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[400px] md:min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="relative h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_BG}')` }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))' }} />
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full relative z-10 py-10 md:py-16">
          <div className="max-w-xl text-white mb-10">
            {/* Botón de tour — visible en hero para acceso rápido */}
            <button
              id="btn-tour-hero"
              type="button"
              onClick={iniciarTour}
              className="hidden"
              aria-label="Iniciar tour"
            />
            <span className="bg-[#0e3a8c] dark:bg-blue-600 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider inline-block">
              {idioma === 'es' ? 'Nuevo Servicio' : 'New Service'}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mt-4 mb-3 md:mb-4 leading-tight">
              {idioma === 'es' ? 'Tu seguridad es nuestra prioridad' : 'Your safety is our priority'}
            </h2>
            <p className="text-lg opacity-90">
              {idioma === 'es'
                ? 'Viaja tranquilo con rastreo GPS y conductores certificados.'
                : 'Travel with peace of mind with GPS tracking and certified drivers.'}
            </p>
          </div>

          {/* Buscador */}
          <div id="buscador-viaje" className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-5 md:p-6 lg:p-8 border border-white/20 dark:border-slate-700 mt-4 transition-colors">
            <form onSubmit={handleBuscar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 items-end">
                {/* Origen combobox */}
                <div id="campo-origen">
                  <ComboboxCiudades
                    opciones={ciudadesOrigen}
                    value={origenTexto}
                    onInputChange={setOrigenTexto}
                    onSelect={handleOrigenSelect}
                    placeholder={h.seleccionarOrigen}
                    loading={loadingOrigen}
                    icon="location_on"
                    label={h.origen}
                  />
                </div>

                {/* Destino combobox */}
                <div id="campo-destino">
                  <ComboboxCiudades
                    opciones={opcionesDestino}
                    value={destinoTexto}
                    onInputChange={setDestinoTexto}
                    onSelect={handleDestinoSelect}
                    placeholder={h.seleccionarDestino}
                    loading={loadingDestino}
                    disabled={opcionesDestino.length === 0 && !loadingDestino && !origenSeleccionado}
                    icon="near_me"
                    label={h.destino}
                  />
                </div>

                {/* Fecha */}
                <label id="campo-fecha" className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[#111318] dark:text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-lg">calendar_month</span> {h.fecha}
                  </span>
                  <input
                    type="date"
                    value={fecha}
                    min={hoyISO()}
                    onChange={handleFechaChange}
                    className={`w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-none rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all text-sm ${
                      fechaError ? 'ring-2 ring-red-400' : ''
                    }`}
                  />
                  {fechaError && <p className="text-xs text-red-500 -mt-1">{fechaError}</p>}
                </label>

                <button
                  id="boton-limpiar"
                  type="button"
                  onClick={limpiarFiltros}
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[#0e3a8c] dark:text-blue-400 h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all text-sm w-full"
                >
                  <span className="material-symbols-outlined text-base">filter_alt_off</span>
                  {h.limpiar}
                </button>

                <button
                  id="boton-buscar"
                  type="submit"
                  className="bg-[#0e3a8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/30 text-sm w-full lg:col-span-1 sm:col-span-2"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  {h.buscarViajesBtn}
                </button>
              </div>

              {/* Filtros avanzados */}
              <div id="filtros-avanzados" className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-400 dark:text-slate-500 hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors group"
                >
                  <span className={`material-symbols-outlined text-lg transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                  {h.filtrosAvanzados}
                </button>

                {filtrosAbiertos && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-6">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h.horaSalida}</p>
                      <div className="flex flex-wrap gap-2">
                        {['Mañana', 'Tarde', 'Noche'].map((horario) => (
                          <button
                            key={horario}
                            type="button"
                            onClick={() => setHoraSalida(horario)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                              horaSalida === horario
                                ? 'border-[#0e3a8c] dark:border-blue-400 bg-[#0e3a8c]/10 dark:bg-blue-400/10 text-[#0e3a8c] dark:text-blue-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#0e3a8c] dark:hover:border-blue-400'
                            }`}
                          >
                            {horario === 'Mañana' ? (idioma === 'es' ? 'Mañana' : 'Morning') : horario === 'Tarde' ? (idioma === 'es' ? 'Tarde' : 'Afternoon') : (idioma === 'es' ? 'Noche' : 'Night')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h.tipoBus}</p>
                      <div className="flex flex-wrap gap-2">
                        {['Premium', 'Estándar'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTipoBus(t)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                              tipoBus === t
                                ? 'border-[#0e3a8c] dark:border-blue-400 bg-[#0e3a8c]/10 dark:bg-blue-400/10 text-[#0e3a8c] dark:text-blue-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#0e3a8c] dark:hover:border-blue-400'
                            }`}
                          >
                            {t === 'Premium' ? (idioma === 'es' ? 'Premium' : 'Premium') : (idioma === 'es' ? 'Estándar' : 'Standard')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h.precioMaximo}</p>
                        <span className="text-xs font-bold text-[#0e3a8c] dark:text-blue-400">${precioMax.toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}</span>
                      </div>
                      <input
                        type="range"
                        min={20000}
                        max={300000}
                        step={5000}
                        value={precioMax}
                        onChange={(e) => setPrecioMax(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0e3a8c] dark:accent-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Tarjetas */}
      <div id="lista-viajes" className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-10 md:mt-14 space-y-12 md:space-y-16 pb-28 md:pb-16">

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/30 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-500">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-center font-medium max-w-md">{error}</p>
            <button
              onClick={refetch}
              className="px-5 py-2.5 bg-[#0e3a8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-all shadow-md shadow-blue-900/20"
            >
              {idioma === 'es' ? 'Reintentar' : 'Retry'}
            </button>
          </div>
        )}

        {/* Empty state (no loading, no error, no results) */}
        {!loading && !error && viajesHoy.length === 0 && viajesProgramados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
              <span className="material-symbols-outlined text-3xl">directions_bus</span>
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{h.noViajes}</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              {idioma === 'es'
                ? 'Intenta seleccionar otra fecha u otro destino para ver viajes disponibles.'
                : 'Try selecting another date or destination to see available trips.'}
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-pulse">
                    <div className="h-32 sm:h-36 bg-slate-200 dark:bg-slate-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-4/5" />
                      <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
                      <div className="flex gap-1.5 pt-1">
                        <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Real data */}
        {!loading && !error && (
          <>
            {(viajesHoy.length > 0 || viajesProgramados.length > 0) && (
              <>
                {/* Viajes de Hoy */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-lg">today</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {h.viajesHoy}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-[#0e3a8c] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                        {viajesHoy.length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200/50 to-transparent dark:from-slate-700 dark:via-slate-700/50" />
                  </div>
                  {viajesHoy.length === 0 ? (
                    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{h.noViajesHoy}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                      {viajesHoy.map((viaje) => (
                        <TarjetaViaje key={viaje.idviaje} viaje={viaje} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Viajes Programados */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-lg">calendar_month</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {h.viajesProgramados}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {viajesProgramados.length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200/50 to-transparent dark:from-slate-700 dark:via-slate-700/50" />
                  </div>
                  {viajesProgramados.length === 0 ? (
                    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{h.noViajes}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                      {viajesProgramados.map((viaje) => (
                        <TarjetaViaje key={viaje.idviaje} viaje={viaje} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}
