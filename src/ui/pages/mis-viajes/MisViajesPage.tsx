import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { ROUTES } from '../../../shared/constants';
import { plataformaEcommerceApi, type MiViaje } from '../../../infrastructure/api/plataformaEcommerceApi';
import { httpClient } from '../../../infrastructure/api/httpClient';
import { usePreferencias } from '../../context/PreferenciasContext';
import { abrirODescargarPdf } from '../../../shared/utils/descargarPdf';

function formatFecha(fechaISO: string, idioma: 'es' | 'en'): string {
  // fechasalida es una fecha de calendario (YYYY-MM-DD): se construye en hora local
  // para que ninguna conversión de zona horaria corra el día.
  const [y, m, d] = String(fechaISO ?? '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(idioma === 'es' ? 'es-CO' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHora(hora: string, idioma: 'es' | 'en'): string {
  if (!hora) return '';
  const [h, m] = hora.split(':');
  const hNum = parseInt(h);
  const periodo = hNum >= 12 
    ? (idioma === 'es' ? 'p. m.' : 'PM') 
    : (idioma === 'es' ? 'a. m.' : 'AM');
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${periodo}`;
}

const colorTarjeta: Record<string, string> = {
  default: 'bg-[#0f2c73]',
};

function getColorTarjeta(tipobus: string): string {
  return colorTarjeta[tipobus] ?? colorTarjeta.default;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MisViajesPage() {
  const { tx, idioma } = usePreferencias();
  const m = tx.misViajes;

  const [viajes, setViajes] = useState<MiViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [fechaBusqueda, setFechaBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');

  // Descarga
  const [descargando, setDescargando] = useState<number | null>(null);

  useEffect(() => {
    plataformaEcommerceApi.getMisViajes()
      .then(setViajes)
      .catch(() => setError(idioma === 'es' ? 'No se pudieron cargar tus viajes. Intenta de nuevo.' : 'Could not load your trips. Please try again.'))
      .finally(() => setLoading(false));
  }, [idioma]);

  const viajesFiltrados = viajes.filter(v => {
    const coincideCodigo = !codigoBusqueda ||
      (v.codigotiquete ?? '').toLowerCase().includes(codigoBusqueda.toLowerCase());
    const coincideFecha = !fechaBusqueda ||
      formatFecha(v.fechasalida, idioma).toLowerCase().includes(fechaBusqueda.toLowerCase());
    const coincideEstado = estadoFiltro === 'Todos' || v.estado === estadoFiltro;
    return coincideCodigo && coincideFecha && coincideEstado;
  });

  const handleDescargar = async (viaje: MiViaje) => {
    if (!viaje.tienePdf) return;
    setDescargando(viaje.idtiquete);
    try {
      await abrirODescargarPdf(async () => {
        const res = await httpClient.get<{ success: boolean; signedUrl: string }>(
          `/wompi/tiquetes/${viaje.idtiquete}/pdf`
        );
        return res.data.signedUrl;
      }, `tiquete-${viaje.codigotiquete || viaje.idtiquete}.pdf`);
    } catch {
      alert(idioma === 'es' ? 'No se pudo generar el enlace de descarga. Intenta de nuevo.' : 'Could not generate download link. Please try again.');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 pb-28 sm:pb-8 transition-colors duration-200">
      <Navbar />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <nav className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-8 flex items-center gap-2 mt-2">
          <Link to={ROUTES.HOME} className="hover:text-[#1b367d] dark:hover:text-blue-400 transition-colors uppercase">{tx.navbar.home}</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#1b2b4e] dark:text-slate-300 uppercase">{m.titulo}</span>
        </nav>

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#1b2b4e] dark:text-slate-100 tracking-tight leading-none">{m.historial}</h1>
              {!loading && (
                <span className="bg-[#eef2f9] dark:bg-slate-800 text-[#1b367d] dark:text-blue-400 text-[11px] sm:text-[13px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
                  {viajes.length} {viajes.length === 1 ? (idioma === 'es' ? 'Viaje' : 'Trip') : (idioma === 'es' ? 'Viajes' : 'Trips')}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-[15px] text-slate-400 dark:text-slate-500 font-medium">
              {idioma === 'es' ? 'Revisa cronológicamente los detalles de tus trayectos.' : 'Chronologically review the details of your trips.'}
            </p>
          </div>

          <Link
            to={ROUTES.HOME}
            className="hidden sm:flex items-center gap-2 bg-[#1b367d] hover:bg-blue-900 text-white text-xs font-extrabold px-6 py-3.5 rounded-2xl transition-all uppercase tracking-wider shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {m.comprarNuevo}
          </Link>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 px-6 py-5 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0 w-full">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2 tracking-wide">{m.codigoTiquete}</label>
              <div className="flex items-center gap-2 border border-slate-200/60 dark:border-slate-700 rounded-full px-4 py-2.5 bg-[#f0f4fd]/60 dark:bg-slate-900/40">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">confirmation_number</span>
                <input
                  type="text"
                  placeholder={idioma === 'es' ? 'Ej. FE-12345' : 'e.g. FE-12345'}
                  value={codigoBusqueda}
                  onChange={e => setCodigoBusqueda(e.target.value)}
                  className="flex-1 text-sm font-medium outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent min-w-0"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2 tracking-wide">{m.fechaViaje}</label>
              <div className="flex items-center gap-2 border border-slate-200/60 dark:border-slate-700 rounded-full px-4 py-2.5 bg-[#f0f4fd]/60 dark:bg-slate-900/40">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">calendar_month</span>
                <input
                  type="text"
                  placeholder={idioma === 'es' ? 'Ej. ene, 2024' : 'e.g. Jan, 2024'}
                  value={fechaBusqueda}
                  onChange={e => setFechaBusqueda(e.target.value)}
                  className="flex-1 text-sm font-medium outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent min-w-0"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2 tracking-wide">{m.estado}</label>
              <div className="flex items-center justify-between border border-slate-200/60 dark:border-slate-700 rounded-full px-4 py-2.5 bg-[#f0f4fd]/60 dark:bg-slate-900/40">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">filter_list</span>
                  <select
                    value={estadoFiltro}
                    onChange={e => setEstadoFiltro(e.target.value)}
                    className="flex-1 text-sm font-medium outline-none text-slate-700 dark:text-slate-200 bg-transparent appearance-none cursor-pointer min-w-0"
                  >
                    <option value="Todos" className="dark:bg-slate-800">{m.todosEstados}</option>
                    <option value="Próximo" className="dark:bg-slate-800">{m.proximo}</option>
                    <option value="Completado" className="dark:bg-slate-800">{m.completado}</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <button
                onClick={() => {}}
                className="hidden sm:inline-flex items-center justify-center bg-[#dbeafe] dark:bg-blue-955/40 hover:bg-[#cbd5e0] dark:hover:bg-slate-700 text-[#1b367d] dark:text-blue-400 text-xs font-extrabold px-6 py-3 rounded-full transition-all uppercase tracking-wider whitespace-nowrap shadow-sm"
              >
                {m.filtrar}
              </button>
              <button
                onClick={() => { setCodigoBusqueda(''); setFechaBusqueda(''); setEstadoFiltro('Todos'); }}
                className="text-xs font-extrabold text-[#1b367d] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700/50 px-4 py-3 rounded-full transition-colors uppercase tracking-wider whitespace-nowrap"
              >
                {m.limpiar}
              </button>
            </div>
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 animate-spin">progress_activity</span>
            <p className="text-slate-400 dark:text-slate-500 font-medium">{m.cargando}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-3xl mb-2 block">error_outline</span>
            {error}
          </div>
        )}

        {!loading && !error && viajesFiltrados.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-8 sm:p-16 text-center flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-colors">
            {viajes.length === 0 ? (
              <>
                <div className="w-20 h-20 rounded-full bg-[#e8f0fe] dark:bg-blue-955/40 flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-[40px]">travel_explore</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#1b2b4e] dark:text-slate-100 mb-2">{m.noViajesRegistrados}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-sm sm:max-w-md mb-8 leading-relaxed">
                  {m.infoFuturos}
                </p>
                <Link
                  to={ROUTES.HOME}
                  className="flex items-center gap-2 bg-[#0a1c43] dark:bg-blue-600 hover:bg-[#1b367d] dark:hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-full transition-all uppercase tracking-wider shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                  {m.explorarRutas}
                </Link>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-[#e8f0fe] dark:bg-blue-955/40 flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-[40px]">search_off</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#1b2b4e] dark:text-slate-100 mb-2">{m.noEncontrados}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-sm sm:max-w-md mb-8 leading-relaxed">
                  {m.infoNoEncontrados}
                </p>
                <button
                  onClick={() => { setCodigoBusqueda(''); setFechaBusqueda(''); setEstadoFiltro('Todos'); }}
                  className="flex items-center gap-2 bg-[#0a1c43] dark:bg-blue-600 hover:bg-[#1b367d] dark:hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-full transition-all uppercase tracking-wider shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                  {m.limpiarFiltros}
                </button>
              </>
            )}
          </div>
        )}

        {/* Lista de viajes */}
        {!loading && !error && viajesFiltrados.length > 0 && (
          <div className="relative">
            <div className="absolute left-[1.125rem] top-10 bottom-12 w-px border-l-[1.5px] border-dotted border-slate-300 dark:border-slate-700 hidden sm:block" />
            <div className="space-y-6">
              {viajesFiltrados.map(viaje => (
                <div key={viaje.idtiquete} className="flex gap-4 sm:gap-8 items-start">
                  <div className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full border-[3px] border-[#f6f6f8] dark:border-slate-900 bg-[#3e5677] dark:bg-slate-800 items-center justify-center z-10 mt-6 shadow-sm">
                    <span className="material-symbols-outlined text-white text-[17px]">directions_bus</span>
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-lg transition-all">
                    <div className="flex flex-col sm:flex-row">

                      {/* Panel izquierdo */}
                      <div className={`${getColorTarjeta(viaje.tipobus)} text-white p-7 sm:w-[15.5rem] flex-shrink-0 flex flex-col justify-center`}>
                        <div className="mb-5 text-center sm:text-left">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 mb-2">{viaje.tipobus}</p>
                          <p className="text-[28px] font-black tracking-tight leading-none">
                            ${Number(viaje.valorcobrado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}
                          </p>
                        </div>
                        <div className="text-center sm:text-left mt-2">
                          <p className="text-[11px] font-medium lowercase tracking-wide opacity-80 mb-0.5">{m.codigo}</p>
                          <p className="text-[15px] font-extrabold tracking-wide">{viaje.codigotiquete ?? `#${viaje.idtiquete}`}</p>
                        </div>
                      </div>

                      {/* Panel central */}
                      <div className="flex-1 p-7 flex flex-col justify-center ml-0 sm:ml-2">
                        <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">{m.trayecto}</p>
                        <div className="flex items-center gap-4 text-[22px] font-black text-[#1b2b4e] dark:text-slate-100">
                          <span>{viaje.origennombre}</span>
                          <span className="material-symbols-outlined text-[#28c76f] text-[28px]">arrow_right_alt</span>
                          <span>{viaje.destinonombre}</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{idioma === 'es' ? 'Asiento' : 'Seat'} {viaje.numeroasiento} · {viaje.placa}</p>
                      </div>

                      {/* Panel derecho */}
                      <div className="p-6 flex flex-col justify-between items-center sm:items-end gap-5 sm:w-72">
                        <div className="bg-[#f8f9fc] dark:bg-slate-900/60 rounded-[1.25rem] p-5 w-full flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">calendar_month</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] dark:text-slate-500 mb-0.5">{m.fecha}</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e] dark:text-slate-200">{formatFecha(viaje.fechasalida, idioma)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">schedule</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] dark:text-slate-500 mb-0.5">{m.hora}</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e] dark:text-slate-200">{formatHora(viaje.horasalida, idioma)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full items-end mt-2">
                          <div className="mb-2">
                            <span className={`text-[9px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${
                              viaje.estado === 'Próximo'
                                ? 'bg-[#fff8e6] text-[#ffb020] border-[#ffb020]/20'
                                : 'bg-[#e8f8f2] text-[#28c76f] border-[#28c76f]/20'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {viaje.estado === 'Próximo' ? m.proximo : m.completado}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDescargar(viaje)}
                            disabled={!viaje.tienePdf || descargando === viaje.idtiquete}
                            className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300 border-[1.5px] border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100 transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {descargando === viaje.idtiquete
                              ? <span className="material-symbols-outlined text-[17px] animate-spin">progress_activity</span>
                              : <span className="material-symbols-outlined text-[17px]">file_download</span>
                            }
                            {viaje.tienePdf ? m.descargarPdf : m.pdfNoDisponible}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
