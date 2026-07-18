import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
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

// ─── Modal de información completa ─────────────────────────────────────────────

function DetalleCampo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 break-words">{value}</span>
    </div>
  );
}

function InfoEncomiendaModal({
  encomienda, qrDataUrl, onClose,
}: {
  encomienda: EncomiendaAPI;
  qrDataUrl: string | null;
  onClose: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;

  const estadoLabel: Record<string, string> = {
    COTIZADA: m.cotizada,
    REGISTRADA: m.registrada,
    EN_TRANSITO: m.enTransito,
    EN_DESTINO: m.enDestino,
    ENTREGADA: m.entregada,
    DEVUELTA: m.devuelta,
  };

  const formatMoneda = (valor: string | number | null | undefined) =>
    valor == null
      ? m.sinDato
      : `$${Number(valor).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}`;

  // El valor cobrado (definitivo) solo existe una vez registrada oficialmente;
  // antes de eso se muestra el valor cotizado (estimado) guardado en la preinscripción.
  const valorMostrado = encomienda.valorcobrado ?? encomienda.valorcotizado;
  const labelValor = encomienda.valorcobrado != null ? m.valorCobrado : m.valorCotizado;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 border border-slate-100 dark:border-slate-700 transition-colors my-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{m.infoCompletaTitulo}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl">close</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" className="w-40 h-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white flex-shrink-0" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 animate-spin">progress_activity</span>
            </div>
          )}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{m.codigoReferencia}</p>
              <p className="text-xl font-extrabold text-[#0e3a8c] dark:text-blue-400">{encomienda.referenciaencomienda}</p>
            </div>
            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1.5 w-fit ${estadoColor[encomienda.estado] ?? estadoColor.COTIZADA}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {estadoLabel[encomienda.estado] ?? encomienda.estado}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-5">
          <DetalleCampo label={m.trayecto} value={`${encomienda.nombreoficinaorigen ?? `#${encomienda.idoficinaorigen}`} → ${encomienda.nombreoficinadestino ?? `#${encomienda.idoficinadestino}`}`} />
          <DetalleCampo label={m.fecha} value={formatFecha(encomienda.fecharegistro, idioma)} />

          {encomienda.nombreremitente && (
            <DetalleCampo label={m.remitente} value={encomienda.nombreremitente} />
          )}
          <DetalleCampo label={m.destinatario} value={encomienda.nombredestinatario} />
          <DetalleCampo label={m.documento} value={encomienda.documentodestinatario} />
          <DetalleCampo label={m.telefono} value={encomienda.telefonodestinatario} />
          {encomienda.direcciondestinatario && (
            <DetalleCampo label={m.direccion} value={encomienda.direcciondestinatario} />
          )}

          <DetalleCampo label={m.contenido} value={encomienda.contenidodeclarado} />
          <DetalleCampo
            label={m.peso}
            value={`${Number(encomienda.pesoreal ?? encomienda.pesoestimado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} kg`}
          />
          {(encomienda.volumenreal ?? encomienda.volumenestimado) != null && (
            <DetalleCampo
              label={m.volumen}
              value={`${Number(encomienda.volumenreal ?? encomienda.volumenestimado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} m³`}
            />
          )}
          <DetalleCampo label={m.valorDeclarado} value={formatMoneda(encomienda.valordeclarado)} />
          <DetalleCampo label={m.domicilio} value={encomienda.esdomicilio ? m.domicilioSi : m.domicilioNo} />
          {encomienda.esdomicilio && (
            <DetalleCampo label={m.valorDomicilio} value={formatMoneda(encomienda.valordomicilio)} />
          )}
          <DetalleCampo label={labelValor} value={formatMoneda(valorMostrado)} />
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6 leading-relaxed">
          {m.instruccionQr}
        </p>
      </div>
    </div>
  );
}

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

  // Modal de información completa (incluye QR)
  const [encomiendaSeleccionada, setEncomiendaSeleccionada] = useState<EncomiendaAPI | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const handleVerInfoCompleta = (encomienda: EncomiendaAPI) => {
    setEncomiendaSeleccionada(encomienda);
    setQrDataUrl(null);
    QRCode.toDataURL(encomienda.referenciaencomienda, { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  };

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

      {encomiendaSeleccionada && (
        <InfoEncomiendaModal
          encomienda={encomiendaSeleccionada}
          qrDataUrl={qrDataUrl}
          onClose={() => setEncomiendaSeleccionada(null)}
        />
      )}

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <nav className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-8 flex items-center gap-2 mt-2">
          <Link to={ROUTES.HOME} className="hover:text-[#1b367d] dark:hover:text-blue-400 transition-colors uppercase">{tx.navbar.home}</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#1b2b4e] dark:text-slate-300 uppercase">{m.titulo}</span>
        </nav>

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
        </div>

        {/* Selector de pestañas para encomiendas (Mobile & Desktop) */}
        <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl mb-8 max-w-md border border-slate-200/40 dark:border-slate-700/50 shadow-sm">
          <Link
            to={ROUTES.ENCOMIENDAS}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-base">local_shipping</span>
            {tx.navbar.cotizarEncomienda}
          </Link>
          <Link
            to={ROUTES.MIS_ENCOMIENDAS}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all bg-[#0e3a8c] dark:bg-blue-600 text-white shadow-sm"
          >
            <span className="material-symbols-outlined text-base">history</span>
            {tx.navbar.misEncomiendas}
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
                return (
                  <div key={enc.idencomienda} className="flex gap-4 sm:gap-8 items-start">
                    <div className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full border-[3px] border-[#f6f6f8] dark:border-slate-900 bg-[#3e5677] dark:bg-slate-800 items-center justify-center z-10 mt-6 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[17px]">local_shipping</span>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row">

                        {/* Panel izquierdo */}
                        <div className="bg-[#0f2c73] text-white p-7 sm:w-[15.5rem] flex-shrink-0 flex flex-col justify-center">

                          <div className="text-center sm:text-left mt-2 mb-4">
                            <p className="text-[11px] font-medium lowercase tracking-wide opacity-80 mb-0.5">{m.codigoReferencia}</p>
                            <p className="text-[15px] font-extrabold tracking-wide">{enc.referenciaencomienda}</p>
                          </div>
                          <button
                            onClick={() => handleVerInfoCompleta(enc)}
                            className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-wide uppercase text-white border-[1.5px] border-white/30 rounded-full px-4 py-2.5 hover:bg-white/10 transition-all w-full"
                          >
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            {m.verInfoCompleta}
                          </button>
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
