import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { ROUTES } from '../../../shared/constants';
import { encomiendasApi, type EncomiendaAPI } from '../../../infrastructure/api/encomiendasApi';
import { usePreferencias } from '../../context/PreferenciasContext';

function formatFecha(fechaISO: string, idioma: 'es' | 'en'): string {
  return new Date(fechaISO).toLocaleDateString(idioma === 'es' ? 'es-CO' : 'en-US', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const estadoColor: Record<string, string> = {
  COTIZADA: 'bg-[#fff8e6] text-[#ffb020] border-[#ffb020]/20',
  REGISTRADA: 'bg-[#e8f0fe] text-[#0e3a8c] border-[#0e3a8c]/20',
  EN_TRANSITO: 'bg-[#e8f0fe] text-[#0e3a8c] border-[#0e3a8c]/20',
  EN_DESTINO: 'bg-[#eef1fb] text-[#6d3ac9] border-[#6d3ac9]/20',
  ENTREGADA: 'bg-[#e8f8f2] text-[#28c76f] border-[#28c76f]/20',
  DEVUELTA: 'bg-red-50 text-red-500 border-red-200',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MisEncomiendasPage() {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;

  const [encomiendas, setEncomiendas] = useState<EncomiendaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');

  const estadoLabel: Record<string, string> = {
    COTIZADA: m.cotizada,
    REGISTRADA: m.registrada,
    EN_TRANSITO: m.enTransito,
    EN_DESTINO: m.enDestino,
    ENTREGADA: m.entregada,
    DEVUELTA: m.devuelta,
  };

  useEffect(() => {
    encomiendasApi.getMisEncomiendas()
      .then((res) => setEncomiendas(res.encomiendas))
      .catch(() => setError(idioma === 'es' ? 'No se pudieron cargar tus encomiendas. Intenta de nuevo.' : 'Could not load your parcels. Please try again.'))
      .finally(() => setLoading(false));
  }, [idioma]);

  const encomiendasFiltradas = encomiendas.filter((e) => {
    const coincideCodigo = !codigoBusqueda ||
      (e.referenciaencomienda ?? '').toLowerCase().includes(codigoBusqueda.toLowerCase());
    const coincideEstado = estadoFiltro === 'Todos' || e.estado === estadoFiltro;
    return coincideCodigo && coincideEstado;
  });

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
                  {encomiendas.length} {encomiendas.length === 1 ? (idioma === 'es' ? 'Encomienda' : 'Parcel') : (idioma === 'es' ? 'Encomiendas' : 'Parcels')}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-[15px] text-slate-400 dark:text-slate-500 font-medium">
              {idioma === 'es' ? 'Revisa el estado y los códigos de tus envíos.' : 'Check the status and codes of your shipments.'}
            </p>
          </div>

          <Link
            to={ROUTES.ENCOMIENDAS}
            className="hidden sm:flex items-center gap-2 bg-[#1b367d] hover:bg-blue-900 text-white text-xs font-extrabold px-6 py-3.5 rounded-2xl transition-all uppercase tracking-wider shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {m.enviarNueva}
          </Link>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 px-6 py-5 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0 w-full">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2 tracking-wide">{m.codigoReferencia}</label>
              <div className="flex items-center gap-2 border border-slate-200/60 dark:border-slate-700 rounded-full px-4 py-2.5 bg-[#f0f4fd]/60 dark:bg-slate-900/40">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">confirmation_number</span>
                <input
                  type="text"
                  placeholder={m.buscarCodigo}
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
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
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="flex-1 text-sm font-medium outline-none text-slate-700 dark:text-slate-200 bg-transparent appearance-none cursor-pointer min-w-0"
                  >
                    <option value="Todos" className="dark:bg-slate-800">{m.todosEstados}</option>
                    {Object.entries(estadoLabel).map(([key, label]) => (
                      <option key={key} value={key} className="dark:bg-slate-800">{label}</option>
                    ))}
                  </select>
                </div>
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <button
                onClick={() => { setCodigoBusqueda(''); setEstadoFiltro('Todos'); }}
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

        {!loading && !error && encomiendasFiltradas.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-8 sm:p-16 text-center flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-colors">
            {encomiendas.length === 0 ? (
              <>
                <div className="w-20 h-20 rounded-full bg-[#e8f0fe] dark:bg-blue-955/40 flex items-center justify-center mb-6 shadow-sm">
                  <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-[40px]">local_shipping</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#1b2b4e] dark:text-slate-100 mb-2">{m.noEncomiendasRegistradas}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-sm sm:max-w-md mb-8 leading-relaxed">
                  {m.infoFuturos}
                </p>
                <Link
                  to={ROUTES.ENCOMIENDAS}
                  className="flex items-center gap-2 bg-[#0a1c43] dark:bg-blue-600 hover:bg-[#1b367d] dark:hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-full transition-all uppercase tracking-wider shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  {m.cotizarAhora}
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
                  onClick={() => { setCodigoBusqueda(''); setEstadoFiltro('Todos'); }}
                  className="flex items-center gap-2 bg-[#0a1c43] dark:bg-blue-600 hover:bg-[#1b367d] dark:hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-full transition-all uppercase tracking-wider shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                  {m.limpiarFiltros}
                </button>
              </>
            )}
          </div>
        )}

        {/* Lista de encomiendas */}
        {!loading && !error && encomiendasFiltradas.length > 0 && (
          <div className="relative">
            <div className="absolute left-[1.125rem] top-10 bottom-12 w-px border-l-[1.5px] border-dotted border-slate-300 dark:border-slate-700 hidden sm:block" />
            <div className="space-y-6">
              {encomiendasFiltradas.map((enc) => {
                const valor = enc.valorcobrado ?? enc.valordeclarado;
                const mostrarValor = enc.valorcobrado != null;
                return (
                  <div key={enc.idencomienda} className="flex gap-4 sm:gap-8 items-start">
                    <div className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full border-[3px] border-[#f6f6f8] dark:border-slate-900 bg-[#3e5677] dark:bg-slate-800 items-center justify-center z-10 mt-6 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[17px]">local_shipping</span>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row">

                        {/* Panel izquierdo */}
                        <div className="bg-[#0f2c73] text-white p-7 sm:w-[15.5rem] flex-shrink-0 flex flex-col justify-center">
                        
                          <div className="text-center sm:text-left mt-2">
                            <p className="text-[11px] font-medium lowercase tracking-wide opacity-80 mb-0.5">{m.codigoReferencia}</p>
                            <p className="text-[15px] font-extrabold tracking-wide">{enc.referenciaencomienda}</p>
                          </div>
                        </div>

                        {/* Panel central */}
                        <div className="flex-1 p-7 flex flex-col justify-center ml-0 sm:ml-2">
                          <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">{m.trayecto}</p>
                          <div className="flex items-center gap-4 text-[22px] font-black text-[#1b2b4e] dark:text-slate-100">
                            <span>{enc.nombreoficinaorigen ?? `#${enc.idoficinaorigen}`}</span>
                            <span className="material-symbols-outlined text-[#28c76f] text-[28px]">arrow_right_alt</span>
                            <span>{enc.nombreoficinadestino ?? `#${enc.idoficinadestino}`}</span>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            {m.destinatario}: {enc.nombredestinatario} · {m.contenido}: {enc.contenidodeclarado}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {m.peso}: {Number(enc.pesoestimado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} kg
                          </p>
                        </div>

                        {/* Panel derecho */}
                        <div className="p-6 flex flex-col justify-between items-center sm:items-end gap-5 sm:w-64">
                          <div className="bg-[#f8f9fc] dark:bg-slate-900/60 rounded-[1.25rem] p-5 w-full flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">calendar_month</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] dark:text-slate-500 mb-0.5">{m.fecha}</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e] dark:text-slate-200">{formatFecha(enc.fecharegistro, idioma)}</p>
                            </div>
                          </div>

                          <div className="mt-2">
                            <span className={`text-[9px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${estadoColor[enc.estado] ?? estadoColor.COTIZADA}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {estadoLabel[enc.estado] ?? enc.estado}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
