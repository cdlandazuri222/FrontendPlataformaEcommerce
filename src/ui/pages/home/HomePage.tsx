import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import { Navbar } from '../../components/layout/Navbar';
import { TarjetaViaje } from '../../components/common/TarjetaViaje';
import { ComboboxCiudades, type OpcionCombobox } from '../../components/common/ComboboxCiudades';
import { plataformaEcommerceApi, type CiudadOrigen, type OpcionDestino, type ViajesQuery } from '../../../infrastructure/api/plataformaEcommerceApi';
import { useViajesHome } from '../../hooks/useViajesHome';

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
  const navigate = useNavigate();

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
      setFechaError('La fecha no puede ser anterior a hoy');
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
      setFechaError('La fecha no puede ser anterior a hoy');
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
    <div className="min-h-screen bg-[#f6f6f8]">
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
            <span className="bg-[#0e3a8c] px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider inline-block">
              Nuevo Servicio
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mt-4 mb-3 md:mb-4 leading-tight">
              Tu seguridad es nuestra prioridad
            </h2>
            <p className="text-lg opacity-90">Viaja tranquilo con rastreo GPS y conductores certificados.</p>
          </div>

          {/* Buscador */}
          <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6 lg:p-8 border border-white/20 mt-4">
            <form onSubmit={handleBuscar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 items-end">
                {/* Origen combobox */}
                <ComboboxCiudades
                  opciones={ciudadesOrigen}
                  value={origenTexto}
                  onInputChange={setOrigenTexto}
                  onSelect={handleOrigenSelect}
                  placeholder="¿Desde dónde sales?"
                  loading={loadingOrigen}
                  icon="location_on"
                  label="Origen"
                />

                {/* Destino combobox */}
                <ComboboxCiudades
                  opciones={opcionesDestino}
                  value={destinoTexto}
                  onInputChange={setDestinoTexto}
                  onSelect={handleDestinoSelect}
                  placeholder="¿A dónde vas?"
                  loading={loadingDestino}
                  disabled={opcionesDestino.length === 0 && !loadingDestino && !origenSeleccionado}
                  icon="near_me"
                  label="Destino"
                />

                {/* Fecha */}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[#111318] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0e3a8c] text-lg">calendar_month</span> Fecha de salida
                  </span>
                  <input
                    type="date"
                    value={fecha}
                    min={hoyISO()}
                    onChange={handleFechaChange}
                    className={`w-full bg-[#f6f6f8] border-none rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#0e3a8c] outline-none transition-all text-sm ${
                      fechaError ? 'ring-2 ring-red-400' : ''
                    }`}
                  />
                  {fechaError && <p className="text-xs text-red-500 -mt-1">{fechaError}</p>}
                </label>

                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="bg-slate-50 border border-slate-200 text-[#0e3a8c] h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-sm w-full"
                >
                  <span className="material-symbols-outlined text-base">filter_alt_off</span>
                  Limpiar
                </button>

                <button
                  type="submit"
                  className="bg-[#0e3a8c] text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/30 text-sm w-full lg:col-span-1 sm:col-span-2"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  Buscar viajes
                </button>
              </div>

              {/* Filtros avanzados */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-[#0e3a8c] transition-colors group"
                >
                  <span className={`material-symbols-outlined text-lg transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                  Filtros Avanzados
                </button>

                {filtrosAbiertos && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-6">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hora de salida</p>
                      <div className="flex flex-wrap gap-2">
                        {['Mañana', 'Tarde', 'Noche'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHoraSalida(h)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                              horaSalida === h
                                ? 'border-[#0e3a8c] bg-[#0e3a8c]/10 text-[#0e3a8c]'
                                : 'border-slate-200 text-slate-600 hover:border-[#0e3a8c]'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Bus</p>
                      <div className="flex flex-wrap gap-2">
                        {['Premium', 'Estándar'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTipoBus(t)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                              tipoBus === t
                                ? 'border-[#0e3a8c] bg-[#0e3a8c]/10 text-[#0e3a8c]'
                                : 'border-slate-200 text-slate-600 hover:border-[#0e3a8c]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Precio máximo</p>
                        <span className="text-xs font-bold text-[#0e3a8c]">${precioMax.toLocaleString('es-CO')}</span>
                      </div>
                      <input
                        type="range"
                        min={20000}
                        max={300000}
                        step={5000}
                        value={precioMax}
                        onChange={(e) => setPrecioMax(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0e3a8c]"
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
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-12 md:mt-16 space-y-12 md:space-y-16 pb-28 md:pb-16">

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
            <p className="text-slate-600 text-center">{error}</p>
            <button
              onClick={refetch}
              className="px-5 py-2.5 bg-[#0e3a8c] text-white rounded-lg font-bold text-sm hover:bg-blue-900 transition-all"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state (no loading, no error, no results) */}
        {!loading && !error && viajesHoy.length === 0 && viajesProgramados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-5xl text-slate-300">directions_bus</span>
            <p className="text-slate-500 text-center font-medium">No hay viajes disponibles en este momento</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <>
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-7 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
                    <div className="h-44 bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-10 bg-slate-200 rounded mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Real data */}
        {!loading && !error && (
          <>
            {(viajesHoy.length > 0 || viajesProgramados.length > 0) && (
              <>
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-extrabold tracking-tight text-[#111318] whitespace-nowrap">Viajes de hoy</h3>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  {viajesHoy.length === 0 ? (
                    <p className="text-slate-400 text-sm">No hay viajes para hoy</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {viajesHoy.map((viaje) => (
                        <TarjetaViaje key={viaje.idviaje} viaje={viaje} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-400 whitespace-nowrap">Viajes programados</h3>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  {viajesProgramados.length === 0 ? (
                    <p className="text-slate-400 text-sm">No hay viajes programados disponibles</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Bottom nav móvil */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-2 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex justify-between items-center z-50 rounded-t-2xl">
        <button onClick={() => navigate(ROUTES.HOME)} className="flex flex-col items-center gap-1 text-[#0e3a8c] p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[26px]">home</span>
          <span className="text-[10px] font-extrabold tracking-wide">Home</span>
        </button>
        <button onClick={() => navigate(ROUTES.MIS_VIAJES)} className="flex flex-col items-center gap-1 text-slate-400 p-2 hover:text-[#0e3a8c] hover:bg-slate-50 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[26px]">confirmation_number</span>
          <span className="text-[10px] font-bold tracking-wide">Mis Viajes</span>
        </button>
        <button onClick={() => navigate(ROUTES.ENCOMIENDAS)} className="flex flex-col items-center gap-1 text-slate-400 p-2 hover:text-[#0e3a8c] hover:bg-slate-50 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[26px]">box_add</span>
          <span className="text-[10px] font-bold tracking-wide">Encomiendas</span>
        </button>
        <button onClick={() => navigate(ROUTES.PERFIL)} className="flex flex-col items-center gap-1 text-slate-400 p-2 hover:text-[#0e3a8c] hover:bg-slate-50 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[26px]">person</span>
          <span className="text-[10px] font-bold tracking-wide">Perfil</span>
        </button>
      </footer>
    </div>
  );
}
