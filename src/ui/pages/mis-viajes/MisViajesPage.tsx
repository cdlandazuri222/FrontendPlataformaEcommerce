import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { ROUTES } from '../../../shared/constants';
import { plataformaEcommerceApi, type MiViaje } from '../../../infrastructure/api/plataformaEcommerceApi';
import { httpClient } from '../../../infrastructure/api/httpClient';



function formatFecha(fechaISO: string): string {
  return new Date(fechaISO).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHora(hora: string): string {
  if (!hora) return '';
  const [h, m] = hora.split(':');
  const hNum = parseInt(h);
  const periodo = hNum >= 12 ? 'p. m.' : 'a. m.';
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
      .catch(() => setError('No se pudieron cargar tus viajes. Intenta de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  const viajesFiltrados = viajes.filter(v => {
    const coincideCodigo = !codigoBusqueda ||
      (v.codigotiquete ?? '').toLowerCase().includes(codigoBusqueda.toLowerCase());
    const coincideFecha = !fechaBusqueda ||
      formatFecha(v.fechasalida).toLowerCase().includes(fechaBusqueda.toLowerCase());
    const coincideEstado = estadoFiltro === 'Todos' || v.estado === estadoFiltro;
    return coincideCodigo && coincideFecha && coincideEstado;
  });

  const handleDescargar = async (viaje: MiViaje) => {
    if (!viaje.tienePdf) return;
    setDescargando(viaje.idtiquete);
    try {
      const res = await httpClient.get<{ success: boolean; signedUrl: string }>(
        `/wompi/tiquetes/${viaje.idtiquete}/pdf`
      );
      if (res.data.success && res.data.signedUrl) {
        window.open(res.data.signedUrl, '_blank');
      }
    } catch {
      alert('No se pudo generar el enlace de descarga. Intenta de nuevo.');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navbar />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <nav className="text-[10px] font-bold tracking-wider text-slate-400 mb-8 flex items-center gap-2 mt-2">
          <Link to={ROUTES.HOME} className="hover:text-[#1b367d] transition-colors uppercase">Inicio</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#1b2b4e] uppercase">Mis Viajes</span>
        </nav>

        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-[32px] font-extrabold text-[#1b2b4e] tracking-tight">Historial de Viajes</h1>
            {!loading && (
              <span className="bg-[#eef2f9] text-[#1b367d] text-[13px] font-bold px-4 py-1.5 rounded-full">
                {viajes.length} {viajes.length === 1 ? 'Viaje' : 'Viajes'}
              </span>
            )}
          </div>
          <p className="text-[15px] text-slate-400 font-medium">Revisa cronológicamente los detalles de tus trayectos.</p>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-[2rem] border border-slate-100 px-6 py-5 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wide">Código de Tiquete</label>
              <div className="flex items-center gap-2 border border-slate-200/80 rounded-full px-4 py-2.5 bg-slate-50/50">
                <span className="material-symbols-outlined text-slate-400 text-lg">confirmation_number</span>
                <input
                  type="text"
                  placeholder="Ej. FE-12345"
                  value={codigoBusqueda}
                  onChange={e => setCodigoBusqueda(e.target.value)}
                  className="flex-1 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400 bg-transparent min-w-0"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wide">Fecha de Viaje</label>
              <div className="flex items-center gap-2 border border-slate-200/80 rounded-full px-4 py-2.5 bg-slate-50/50">
                <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
                <input
                  type="text"
                  placeholder="Ej. ene, 2024"
                  value={fechaBusqueda}
                  onChange={e => setFechaBusqueda(e.target.value)}
                  className="flex-1 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400 bg-transparent min-w-0"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wide">Estado</label>
              <div className="flex items-center justify-between border border-slate-200/80 rounded-full px-4 py-2.5 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 text-lg">filter_list</span>
                  <select
                    value={estadoFiltro}
                    onChange={e => setEstadoFiltro(e.target.value)}
                    className="flex-1 text-sm font-medium outline-none text-slate-700 bg-transparent appearance-none cursor-pointer min-w-0"
                  >
                    <option>Todos</option>
                    <option>Próximo</option>
                    <option>Completado</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-lg pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end">
              <button
                onClick={() => { setCodigoBusqueda(''); setFechaBusqueda(''); setEstadoFiltro('Todos'); }}
                className="text-xs font-extrabold text-[#1b367d] hover:bg-blue-50 px-4 py-2.5 rounded-full transition-colors uppercase tracking-wider whitespace-nowrap"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
            <p className="text-slate-400 font-medium">Cargando tus viajes...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-3xl mb-2 block">error_outline</span>
            {error}
          </div>
        )}

        {!loading && !error && viajesFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
            <p className="mt-4 text-slate-400 font-medium">
              {viajes.length === 0 ? 'Aún no tienes viajes registrados.' : 'No se encontraron viajes con esos filtros.'}
            </p>
          </div>
        )}

        {/* Lista de viajes */}
        {!loading && !error && viajesFiltrados.length > 0 && (
          <div className="relative">
            <div className="absolute left-[1.125rem] top-10 bottom-12 w-px border-l-[1.5px] border-dotted border-slate-300 hidden sm:block" />
            <div className="space-y-6">
              {viajesFiltrados.map(viaje => (
                <div key={viaje.idtiquete} className="flex gap-4 sm:gap-8 items-start">
                  <div className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full border-[3px] border-[#f6f6f8] bg-[#3e5677] items-center justify-center z-10 mt-6 shadow-sm">
                    <span className="material-symbols-outlined text-white text-[17px]">directions_bus</span>
                  </div>

                  <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row">

                      {/* Panel izquierdo */}
                      <div className={`${getColorTarjeta(viaje.tipobus)} text-white p-7 sm:w-[15.5rem] flex-shrink-0 flex flex-col justify-center`}>
                        <div className="mb-5 text-center sm:text-left">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 mb-2">{viaje.tipobus}</p>
                          <p className="text-[28px] font-black tracking-tight leading-none">
                            ${Number(viaje.valorcobrado).toLocaleString('es-CO')}
                          </p>
                        </div>
                        <div className="text-center sm:text-left mt-2">
                          <p className="text-[11px] font-medium lowercase tracking-wide opacity-80 mb-0.5">código</p>
                          <p className="text-[15px] font-extrabold tracking-wide">{viaje.codigotiquete ?? `#${viaje.idtiquete}`}</p>
                        </div>
                      </div>

                      {/* Panel central */}
                      <div className="flex-1 p-7 flex flex-col justify-center ml-0 sm:ml-2">
                        <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 mb-2">Trayecto</p>
                        <div className="flex items-center gap-4 text-[22px] font-black text-[#1b2b4e]">
                          <span>{viaje.origennombre}</span>
                          <span className="material-symbols-outlined text-[#28c76f] text-[28px]">arrow_right_alt</span>
                          <span>{viaje.destinonombre}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Asiento {viaje.numeroasiento} · {viaje.placa}</p>
                      </div>

                      {/* Panel derecho */}
                      <div className="p-6 flex flex-col justify-between items-center sm:items-end gap-5 sm:w-72">
                        <div className="bg-[#f8f9fc] rounded-[1.25rem] p-5 w-full flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">calendar_month</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] mb-0.5">Fecha</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e]">{formatFecha(viaje.fechasalida)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">schedule</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] mb-0.5">Hora</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e]">{formatHora(viaje.horasalida)}</p>
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
                              {viaje.estado}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDescargar(viaje)}
                            disabled={!viaje.tienePdf || descargando === viaje.idtiquete}
                            className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-wide uppercase text-slate-600 border-[1.5px] border-slate-200 rounded-full px-5 py-3 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all w-full disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {descargando === viaje.idtiquete
                              ? <span className="material-symbols-outlined text-[17px] animate-spin">progress_activity</span>
                              : <span className="material-symbols-outlined text-[17px]">file_download</span>
                            }
                            {viaje.tienePdf ? 'Descargar PDF' : 'PDF no disponible'}
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
