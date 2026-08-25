import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Navbar } from '../../components/layout/Navbar';
import { ROUTES } from '../../../shared/constants';
import { encomiendasApi, type EncomiendaAPI } from '../../../infrastructure/api/encomiendasApi';
import { usePreferencias } from '../../context/PreferenciasContext';

function formatFecha(fechaISO: string, idioma: 'es' | 'en'): string {
  if (!fechaISO) return '';
  return new Date(fechaISO).toLocaleDateString(idioma === 'es' ? 'es-CO' : 'en-US', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function parseOficina(nombre?: string, idFallback?: number): { ciudad: string; detalle: string } {
  if (!nombre) return { ciudad: `#${idFallback ?? '–'}`, detalle: '' };
  const parts = nombre.split(/\s*[-–—]\s*/);
  if (parts.length > 1) {
    return {
      ciudad: parts[0].trim(),
      detalle: parts.slice(1).join(' – ').trim(),
    };
  }
  return { ciudad: nombre.trim(), detalle: '' };
}

interface EstadoStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: string;
}

const estadoStyleMap: Record<string, EstadoStyle> = {
  COTIZADA: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500',
    icon: 'request_quote',
  },
  REGISTRADA: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800/50',
    dot: 'bg-sky-500',
    icon: 'inventory_2',
  },
  EN_TRANSITO: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-[#0e3a8c] dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/50',
    dot: 'bg-[#0e3a8c] dark:bg-blue-400 animate-pulse',
    icon: 'local_shipping',
  },
  EN_DESTINO: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/50',
    dot: 'bg-purple-500',
    icon: 'pin_drop',
  },
  ENTREGADA: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500',
    icon: 'check_circle',
  },
  DEVUELTA: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/50',
    dot: 'bg-rose-500',
    icon: 'assignment_return',
  },
};

// ─── Modal de información completa ─────────────────────────────────────────────

function DetalleCampo({
  label,
  value,
  icon,
  destacado = false,
  colSpan = 'col-span-1',
}: {
  label: string;
  value: string;
  icon?: string;
  destacado?: boolean;
  colSpan?: string;
}) {
  return (
    <div
      className={`${colSpan} ${
        destacado
          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/50'
          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'
      } p-3 sm:p-3.5 rounded-2xl border flex flex-col justify-between gap-1 transition-all`}
    >
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
        {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={`text-xs sm:text-sm font-bold ${
          destacado
            ? 'text-[#0e3a8c] dark:text-blue-400 font-extrabold'
            : 'text-slate-800 dark:text-slate-200'
        } break-words leading-snug`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoEncomiendaModal({
  encomienda,
  qrDataUrl,
  onClose,
}: {
  encomienda: EncomiendaAPI;
  qrDataUrl: string | null;
  onClose: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;
  const [copiado, setCopiado] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll de la página de fondo y capturar todo el scroll exclusivamente para el modal
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (contentRef.current) {
        contentRef.current.scrollTop += e.deltaY;
      }
    };

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.addEventListener('wheel', handleWheel, { passive: false });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (overlay) {
        overlay.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCopiar = () => {
    navigator.clipboard.writeText(encomienda.referenciaencomienda);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const estadoLabel: Record<string, string> = {
    COTIZADA: m.cotizada,
    REGISTRADA: m.registrada,
    EN_TRANSITO: m.enTransito,
    EN_DESTINO: m.enDestino,
    ENTREGADA: m.entregada,
    DEVUELTA: m.devuelta,
  };

  const st = estadoStyleMap[encomienda.estado] ?? estadoStyleMap.COTIZADA;

  const formatMoneda = (valor: string | number | null | undefined) =>
    valor == null
      ? m.sinDato
      : `$${Number(valor).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}`;

  const valorMostrado = encomienda.valorcobrado ?? encomienda.valorcotizado;
  const labelValor = encomienda.valorcobrado != null ? m.valorCobrado : m.valorCotizado;

  const origen = parseOficina(encomienda.nombreoficinaorigen, encomienda.idoficinaorigen);
  const destino = parseOficina(encomienda.nombreoficinadestino, encomienda.idoficinadestino);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl z-10 border border-slate-200/80 dark:border-slate-700/80 transition-all flex flex-col max-h-[92vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal (Sticky Top) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#0e3a8c] dark:text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                {m.infoCompletaTitulo}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                {formatFecha(encomienda.fecharegistro, idioma)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          ref={contentRef}
          className="p-5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 overscroll-contain"
        >
          {/* QR & Referencia Banner */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="bg-white p-2 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Encomienda" className="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600 animate-spin">
                    progress_activity
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start gap-1.5 w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                {m.codigoReferencia}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg sm:text-2xl font-black text-[#0e3a8c] dark:text-blue-400 tracking-wider">
                  {encomienda.referenciaencomienda}
                </span>
                <button
                  onClick={handleCopiar}
                  title={m.copiarCodigo}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiado ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              {copiado && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {m.codigoCopiado}
                </span>
              )}

              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                  <span className="material-symbols-outlined text-sm">{st.icon}</span>
                  {estadoLabel[encomienda.estado] ?? encomienda.estado}
                </span>
                {encomienda.esdomicilio && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                    <span className="material-symbols-outlined text-xs">home</span>
                    {m.domicilioBadge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trayecto / Ruta destacado (Full width) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-2">
              <span className="material-symbols-outlined text-sm">route</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{m.trayecto}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  {idioma === 'es' ? 'Origen' : 'Origin'}
                </p>
                <p className="font-extrabold text-slate-800 dark:text-slate-100">{origen.ciudad}</p>
                {origen.detalle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{origen.detalle}</p>
                )}
              </div>
              <div className="hidden sm:flex items-center justify-center text-slate-400 px-2">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                  {idioma === 'es' ? 'Destino' : 'Destination'}
                </p>
                <p className="font-extrabold text-slate-800 dark:text-slate-100">{destino.ciudad}</p>
                {destino.detalle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{destino.detalle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Datos en Grilla Responsive (2 Columnas ordenadas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {encomienda.nombreremitente && (
              <DetalleCampo label={m.remitente} value={encomienda.nombreremitente} icon="person" />
            )}
            <DetalleCampo label={m.destinatario} value={encomienda.nombredestinatario} icon="person_pin" />
            <DetalleCampo label={m.documento} value={encomienda.documentodestinatario} icon="badge" />
            <DetalleCampo label={m.telefono} value={encomienda.telefonodestinatario} icon="call" />

            {encomienda.direcciondestinatario && (
              <DetalleCampo
                label={m.direccion}
                value={encomienda.direcciondestinatario}
                icon="location_on"
                colSpan="col-span-1 sm:col-span-2"
              />
            )}

            <DetalleCampo
              label={m.contenido}
              value={encomienda.contenidodeclarado}
              icon="inventory_2"
              colSpan="col-span-1 sm:col-span-2"
            />
            
            <DetalleCampo
              label={m.peso}
              value={`${Number(encomienda.pesoreal ?? encomienda.pesoestimado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} kg`}
              icon="scale"
            />
            {(encomienda.volumenreal ?? encomienda.volumenestimado) != null && (
              <DetalleCampo
                label={m.volumen}
                value={`${Number(encomienda.volumenreal ?? encomienda.volumenestimado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} m³`}
                icon="view_in_ar"
              />
            )}
            <DetalleCampo label={m.valorDeclarado} value={formatMoneda(encomienda.valordeclarado)} icon="shield" />
            <DetalleCampo
              label={labelValor}
              value={formatMoneda(valorMostrado)}
              icon="payments"
              destacado
            />
          </div>

          {/* Footer instruction */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed pt-1">
            {m.instruccionQr}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Tarjeta de Encomienda (Compacto & Atractivo) ───────────────────

function TarjetaEncomienda({
  encomienda,
  onVerDetalles,
}: {
  encomienda: EncomiendaAPI;
  onVerDetalles: (enc: EncomiendaAPI) => void;
}) {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(encomienda.referenciaencomienda);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  const estadoLabel: Record<string, string> = {
    COTIZADA: m.cotizada,
    REGISTRADA: m.registrada,
    EN_TRANSITO: m.enTransito,
    EN_DESTINO: m.enDestino,
    ENTREGADA: m.entregada,
    DEVUELTA: m.devuelta,
  };

  const st = estadoStyleMap[encomienda.estado] ?? estadoStyleMap.COTIZADA;
  const origen = parseOficina(encomienda.nombreoficinaorigen, encomienda.idoficinaorigen);
  const destino = parseOficina(encomienda.nombreoficinadestino, encomienda.idoficinadestino);

  const valor = encomienda.valorcobrado ?? encomienda.valorcotizado;
  const valorFormateado = valor != null
    ? `$${Number(valor).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}`
    : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500/40 transition-all duration-200 group flex flex-col gap-4">
      
      {/* ── Fila Superior: Referencia + Estado + Fecha ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Código de Referencia + Botón Copiar */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/70 border border-slate-200/70 dark:border-slate-600/70 px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-sm">confirmation_number</span>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
              {encomienda.referenciaencomienda}
            </span>
            <button
              onClick={handleCopiar}
              title={m.copiarCodigo}
              className="ml-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-600"
            >
              <span className="material-symbols-outlined text-[13px] block">
                {copiado ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
          {copiado && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
              {m.codigoCopiado}
            </span>
          )}

          {encomienda.esdomicilio ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 px-2.5 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-xs">home</span>
              {m.domicilioBadge}
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-xs">store</span>
              {m.enAgencia}
            </span>
          )}
        </div>

        {/* Estado + Fecha */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <span className="material-symbols-outlined text-xs">calendar_month</span>
            <span>{formatFecha(encomienda.fecharegistro, idioma)}</span>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${st.bg} ${st.text} ${st.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
            <span>{estadoLabel[encomienda.estado] ?? encomienda.estado}</span>
          </span>
        </div>
      </div>

      {/* ── Fila Central: Trayecto / Ruta de Envío ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 py-2 border-y border-slate-100 dark:border-slate-700/60">
        
        {/* Ruta: Origen -> Destino */}
        <div className="md:col-span-7 flex items-center gap-3 sm:gap-4">
          
          {/* Origen */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0e3a8c] dark:bg-blue-400 flex-shrink-0" />
              <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 truncate" title={origen.ciudad}>
                {origen.ciudad}
              </p>
            </div>
            {origen.detalle && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate pl-3.5 mt-0.5" title={origen.detalle}>
                {origen.detalle}
              </p>
            )}
          </div>

          {/* Conector Visual */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 px-1">
            <div className="flex items-center gap-1">
              <div className="w-4 sm:w-6 h-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xs">local_shipping</span>
              </div>
              <div className="w-4 sm:w-6 h-0.5 bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          {/* Destino */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 truncate" title={destino.ciudad}>
                {destino.ciudad}
              </p>
            </div>
            {destino.detalle && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate pl-3.5 mt-0.5" title={destino.detalle}>
                {destino.detalle}
              </p>
            )}
          </div>
        </div>

        {/* Destinatario y Detalles del paquete */}
        <div className="md:col-span-5 flex flex-wrap md:flex-col justify-center gap-1.5 md:border-l md:border-slate-100 md:dark:border-slate-700/60 md:pl-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-sm">person</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">{m.destinatario}:</span>
            <span className="font-bold truncate max-w-[170px] sm:max-w-[200px]" title={encomienda.nombredestinatario}>
              {encomienda.nombredestinatario}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-sm">package_2</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Number(encomienda.pesoestimado).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} kg
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="truncate max-w-[160px] text-slate-500 dark:text-slate-400" title={encomienda.contenidodeclarado}>
              {encomienda.contenidodeclarado}
            </span>
          </div>
        </div>

      </div>

      {/* ── Fila Inferior: Valor + Botón Acción ── */}
      <div className="flex items-center justify-between gap-4 pt-0.5">
        <div>
          {valorFormateado ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {encomienda.valorcobrado != null ? m.valorCobrado : m.valorCotizado}:
              </span>
              <span className="text-base sm:text-lg font-black text-[#0e3a8c] dark:text-blue-400">
                {valorFormateado}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {m.sinDato}
            </span>
          )}
        </div>

        <button
          onClick={() => onVerDetalles(encomienda)}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-[#0e3a8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:gap-2 active:scale-98"
        >
          <span className="material-symbols-outlined text-sm">qr_code_2</span>
          <span>{m.verInfoCompleta}</span>
        </button>
      </div>

    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

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
    QRCode.toDataURL(encomienda.referenciaencomienda, {
      width: 220,
      margin: 1,
      color: { dark: '#0a1c43', light: '#ffffff' },
    })
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

  // Contadores por estado
  const conteoPorEstado = encomiendas.reduce<Record<string, number>>((acc, enc) => {
    acc[enc.estado] = (acc[enc.estado] || 0) + 1;
    return acc;
  }, {});

  const encomiendasFiltradas = encomiendas.filter((e) => {
    const coincideCodigo = !codigoBusqueda ||
      (e.referenciaencomienda ?? '').toLowerCase().includes(codigoBusqueda.toLowerCase()) ||
      (e.nombredestinatario ?? '').toLowerCase().includes(codigoBusqueda.toLowerCase()) ||
      (e.contenidodeclarado ?? '').toLowerCase().includes(codigoBusqueda.toLowerCase());
    const coincideEstado = estadoFiltro === 'Todos' || e.estado === estadoFiltro;
    return coincideCodigo && coincideEstado;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 pb-28 sm:pb-12 transition-colors duration-200">
      <Navbar />

      {encomiendaSeleccionada && (
        <InfoEncomiendaModal
          encomienda={encomiendaSeleccionada}
          qrDataUrl={qrDataUrl}
          onClose={() => setEncomiendaSeleccionada(null)}
        />
      )}

      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Breadcrumb */}
        <nav className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-1.5">
          <Link to={ROUTES.HOME} className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors uppercase">
            {tx.navbar.home}
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#0e3a8c] dark:text-slate-200 uppercase font-extrabold">{m.titulo}</span>
        </nav>

        {/* Encabezado y Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                {m.historial}
              </h1>
              {!loading && (
                <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 text-xs font-black px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/40">
                  {encomiendas.length} {encomiendas.length === 1 ? (idioma === 'es' ? 'Encomienda' : 'Parcel') : (idioma === 'es' ? 'Encomiendas' : 'Parcels')}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {idioma === 'es' ? 'Rastrea el estado, códigos y detalles de todas tus encomiendas.' : 'Track status, codes, and details of all your parcel shipments.'}
            </p>
          </div>

          {/* Botón Cotizar Nueva */}
          <Link
            to={ROUTES.ENCOMIENDAS}
            className="inline-flex items-center justify-center gap-2 bg-[#0e3a8c] hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-extrabold px-5 py-3 rounded-xl transition-all uppercase tracking-wider shadow-sm hover:shadow-md active:scale-98 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-base">local_shipping</span>
            {tx.navbar.cotizarEncomienda}
          </Link>
        </div>

        {/* ── Filtros Rápidos por Estado (Chips / Tabs) ── */}
        {!loading && encomiendas.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <button
              onClick={() => setEstadoFiltro('Todos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                estadoFiltro === 'Todos'
                  ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white border-[#0e3a8c] dark:border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <span>{m.todosEstados}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                estadoFiltro === 'Todos' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {encomiendas.length}
              </span>
            </button>

            {Object.entries(estadoLabel).map(([key, label]) => {
              const count = conteoPorEstado[key] || 0;
              if (count === 0 && estadoFiltro !== key) return null;
              const isSelected = estadoFiltro === key;
              return (
                <button
                  key={key}
                  onClick={() => setEstadoFiltro(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white border-[#0e3a8c] dark:border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Barra de Búsqueda y Filtros ── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 mb-6 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            
            {/* Buscador */}
            <div className="flex-1 w-full relative">
              <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-900/50 focus-within:border-[#0e3a8c] dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">search</span>
                <input
                  type="text"
                  placeholder={idioma === 'es' ? 'Buscar por código, destinatario o contenido...' : 'Search by code, recipient, or content...'}
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                  className="flex-1 text-xs sm:text-sm font-medium outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent min-w-0"
                />
                {codigoBusqueda && (
                  <button
                    onClick={() => setCodigoBusqueda('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Estado */}
            <div className="w-full sm:w-56">
              <div className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-900/50 focus-within:border-[#0e3a8c] dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg">filter_list</span>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="flex-1 text-xs sm:text-sm font-medium outline-none text-slate-700 dark:text-slate-200 bg-transparent appearance-none cursor-pointer min-w-0"
                  >
                    <option value="Todos" className="dark:bg-slate-800">{m.todosEstados}</option>
                    {Object.entries(estadoLabel).map(([key, label]) => (
                      <option key={key} value={key} className="dark:bg-slate-800">{label}</option>
                    ))}
                  </select>
                </div>
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-base pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Limpiar Filtros */}
            {(codigoBusqueda || estadoFiltro !== 'Todos') && (
              <button
                onClick={() => { setCodigoBusqueda(''); setEstadoFiltro('Todos'); }}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center"
              >
                <span className="material-symbols-outlined text-base">filter_alt_off</span>
                {m.limpiar}
              </button>
            )}
          </div>
        </div>

        {/* ── Estado de Carga ── */}
        {loading && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-[#0e3a8c] dark:text-blue-400 animate-spin">progress_activity</span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{m.cargando}</p>
          </div>
        )}

        {/* ── Estado de Error ── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl p-6 text-center shadow-xs">
            <span className="material-symbols-outlined text-3xl mb-2 block">error_outline</span>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* ── Estado Vacío (Sin Encomiendas o Sin Resultados) ── */}
        {!loading && !error && encomiendasFiltradas.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center shadow-xs transition-colors">
            {encomiendas.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-4 text-[#0e3a8c] dark:text-blue-400">
                  <span className="material-symbols-outlined text-3xl">local_shipping</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mb-1.5">
                  {m.noEncomiendasRegistradas}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mb-6 leading-relaxed">
                  {m.infoFuturos}
                </p>
                <Link
                  to={ROUTES.ENCOMIENDAS}
                  className="inline-flex items-center gap-2 bg-[#0e3a8c] hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-all uppercase tracking-wider shadow-sm hover:shadow-md active:scale-98"
                >
                  <span className="material-symbols-outlined text-base">add_box</span>
                  {m.cotizarAhora}
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4 text-slate-400">
                  <span className="material-symbols-outlined text-3xl">search_off</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mb-1.5">
                  {m.noEncontrados}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mb-6 leading-relaxed">
                  {m.infoNoEncontrados}
                </p>
                <button
                  onClick={() => { setCodigoBusqueda(''); setEstadoFiltro('Todos'); }}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-[#0e3a8c] dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">filter_alt_off</span>
                  {m.limpiarFiltros}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Lista de Tarjetas de Encomiendas ── */}
        {!loading && !error && encomiendasFiltradas.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {encomiendasFiltradas.map((enc) => (
              <TarjetaEncomienda
                key={enc.idencomienda}
                encomienda={enc}
                onVerDetalles={handleVerInfoCompleta}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
