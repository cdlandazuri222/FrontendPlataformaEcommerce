import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

// ─── Geo Coordenadas para Ciudades de Cootranar ───────────────────────────────

interface CiudadGeo {
  lat: number;
  lng: number;
  nombre: string;
  departamento: string;
}

const CIUDADES_GEO: Record<string, CiudadGeo> = {
  pasto: { lat: 1.2136, lng: -77.2811, nombre: 'Pasto', departamento: 'Nariño' },
  ipiales: { lat: 0.8248, lng: -77.6417, nombre: 'Ipiales', departamento: 'Nariño' },
  tumaco: { lat: 1.7986, lng: -78.8156, nombre: 'Tumaco', departamento: 'Nariño' },
  tuquerres: { lat: 1.0850, lng: -77.6186, nombre: 'Túquerres', departamento: 'Nariño' },
  túquerres: { lat: 1.0850, lng: -77.6186, nombre: 'Túquerres', departamento: 'Nariño' },
  launion: { lat: 1.6033, lng: -77.1317, nombre: 'La Unión', departamento: 'Nariño' },
  'la unión': { lat: 1.6033, lng: -77.1317, nombre: 'La Unión', departamento: 'Nariño' },
  samaniego: { lat: 1.3361, lng: -77.5939, nombre: 'Samaniego', departamento: 'Nariño' },
  buesaco: { lat: 1.3831, lng: -77.1558, nombre: 'Buesaco', departamento: 'Nariño' },
  chachagui: { lat: 1.3589, lng: -77.2839, nombre: 'Chachagüí', departamento: 'Nariño' },
  chachagüí: { lat: 1.3589, lng: -77.2839, nombre: 'Chachagüí', departamento: 'Nariño' },
  popayan: { lat: 2.4448, lng: -76.6147, nombre: 'Popayán', departamento: 'Cauca' },
  popayán: { lat: 2.4448, lng: -76.6147, nombre: 'Popayán', departamento: 'Cauca' },
  elbordo: { lat: 2.1167, lng: -76.9833, nombre: 'El Bordo', departamento: 'Cauca' },
  'el bordo': { lat: 2.1167, lng: -76.9833, nombre: 'El Bordo', departamento: 'Cauca' },
  cali: { lat: 3.4516, lng: -76.5320, nombre: 'Cali', departamento: 'Valle del Cauca' },
  palmira: { lat: 3.5394, lng: -76.3036, nombre: 'Palmira', departamento: 'Valle del Cauca' },
  buga: { lat: 3.9008, lng: -76.2978, nombre: 'Buga', departamento: 'Valle del Cauca' },
  buenaventura: { lat: 3.8823, lng: -77.0312, nombre: 'Buenaventura', departamento: 'Valle del Cauca' },
  pereira: { lat: 4.8133, lng: -75.6961, nombre: 'Pereira', departamento: 'Risaralda' },
  armenia: { lat: 4.5339, lng: -75.6811, nombre: 'Armenia', departamento: 'Quindío' },
  manizales: { lat: 5.0689, lng: -75.5174, nombre: 'Manizales', departamento: 'Caldas' },
  bogota: { lat: 4.7110, lng: -74.0721, nombre: 'Bogotá', departamento: 'Cundinamarca' },
  bogotá: { lat: 4.7110, lng: -74.0721, nombre: 'Bogotá', departamento: 'Cundinamarca' },
  medellin: { lat: 6.2442, lng: -75.5812, nombre: 'Medellín', departamento: 'Antioquia' },
  medellín: { lat: 6.2442, lng: -75.5812, nombre: 'Medellín', departamento: 'Antioquia' },
  neiva: { lat: 2.9273, lng: -75.2819, nombre: 'Neiva', departamento: 'Huila' },
};

function resolverGeoCiudad(nombreCiudad?: string): CiudadGeo {
  const norm = (nombreCiudad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  for (const [key, val] of Object.entries(CIUDADES_GEO)) {
    const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes(keyNorm) || keyNorm.includes(norm)) {
      return val;
    }
  }
  return { lat: 1.2136, lng: -77.2811, nombre: nombreCiudad || 'Pasto', departamento: 'Nariño' };
}

export type TabDetalle = 'GPS' | 'INFO' | 'OFICINA_ORIGEN' | 'OFICINA_DESTINO';

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
      } p-3.5 rounded-2xl border flex flex-col justify-between gap-1 transition-all`}
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

// ─── Vista Detalle y Rastreo en la Misma Página ────────────────────────────────

function VistaDetalleEncomienda({
  encomienda,
  tabInicial = 'GPS',
  onVolver,
}: {
  encomienda: EncomiendaAPI;
  tabInicial?: TabDetalle;
  onVolver: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;
  const [tabActiva, setTabActiva] = useState<TabDetalle>(tabInicial);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiadoRef, setCopiadoRef] = useState(false);
  const [copiadoDir, setCopiadoDir] = useState(false);
  const [compartidoTracking, setCompartidoTracking] = useState(false);
  const [mostrarMapaDetallado, setMostrarMapaDetallado] = useState(false);
  const [ultimaSenalGps] = useState<string>('En vivo');

  useEffect(() => {
    QRCode.toDataURL(encomienda.referenciaencomienda, {
      width: 240,
      margin: 1,
      color: { dark: '#0a1c43', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [encomienda.referenciaencomienda]);

  const handleCopiarRef = () => {
    navigator.clipboard.writeText(encomienda.referenciaencomienda);
    setCopiadoRef(true);
    setTimeout(() => setCopiadoRef(false), 2000);
  };

  const handleCopiarDireccion = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoDir(true);
    setTimeout(() => setCopiadoDir(false), 2000);
  };

  const origen = parseOficina(encomienda.nombreoficinaorigen, encomienda.idoficinaorigen);
  const destino = parseOficina(encomienda.nombreoficinadestino, encomienda.idoficinadestino);

  const geoOrigen = resolverGeoCiudad(origen.ciudad);
  const geoDestino = resolverGeoCiudad(destino.ciudad);

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

  // Mapeo de los 6 pasos idénticos a la imagen de referencia
  // 1: En Preparación | 2: Admisión Punto Cootranar | 3: Retiro | 4: En Tránsito | 5: En Reparto | 6: Entregado
  let pasoActivo = 1;
  let factorProgreso = 0.1;
  let velocidad = '0 km/h';
  let sectorActual = '';
  let mensajeEstadoPrincipal = '';

  switch (encomienda.estado) {
    case 'COTIZADA':
      pasoActivo = 1;
      factorProgreso = 0.08;
      velocidad = '0 km/h';
      sectorActual = `Oficina de origen en ${geoOrigen.nombre} · Preinscripción`;
      mensajeEstadoPrincipal = idioma === 'es'
        ? `Tu orden de servicio ha sido preinscrita con éxito. Presenta el código ${encomienda.referenciaencomienda} en la taquilla de Cootranar ${geoOrigen.nombre} para despachar tu paquete.`
        : `Your shipment order has been pre-registered. Present reference ${encomienda.referenciaencomienda} at the Cootranar office in ${geoOrigen.nombre} to dispatch.`;
      break;
    case 'REGISTRADA':
      pasoActivo = 2;
      factorProgreso = 0.25;
      velocidad = '0 km/h (En patio de carga)';
      sectorActual = `Bodega principal · Agencia Cootranar ${geoOrigen.nombre}`;
      mensajeEstadoPrincipal = idioma === 'es'
        ? `Tu paquete ha sido admitido en la agencia Cootranar ${geoOrigen.nombre}. Está en preparación para asignación de ruta.`
        : `Your parcel was admitted at Cootranar branch ${geoOrigen.nombre}. Ready for route assignment.`;
      break;
    case 'EN_TRANSITO':
      pasoActivo = 4;
      factorProgreso = 0.65;
      velocidad = '68 km/h (En carretera)';
      sectorActual = `Vía Panamericana · Corredor ${geoOrigen.nombre} ➔ ${geoDestino.nombre}`;
      mensajeEstadoPrincipal = idioma === 'es'
        ? `Tu envío se encuentra en tránsito desde ${geoOrigen.nombre} hacia ${geoDestino.nombre} con monitoreo satelital continuo.`
        : `Your shipment is in transit from ${geoOrigen.nombre} to ${geoDestino.nombre} with continuous GPS monitoring.`;
      break;
    case 'EN_DESTINO':
      pasoActivo = 5;
      factorProgreso = 0.88;
      velocidad = '0 km/h';
      sectorActual = `Agencia Cootranar ${geoDestino.nombre}`;
      mensajeEstadoPrincipal = encomienda.esdomicilio
        ? (idioma === 'es'
            ? `Tu envío está en reparto local hacia la dirección del destinatario ${encomienda.nombredestinatario} en ${geoDestino.nombre}.`
            : `Your parcel is out for local delivery to recipient ${encomienda.nombredestinatario} in ${geoDestino.nombre}.`)
        : (idioma === 'es'
            ? `Tu envío ha llegado a la agencia de Cootranar ${geoDestino.nombre} y está listo para retiro en taquilla.`
            : `Your parcel has arrived at the Cootranar branch in ${geoDestino.nombre} and is ready for pick-up.`);
      break;
    case 'ENTREGADA':
      pasoActivo = 6;
      factorProgreso = 1.0;
      velocidad = '0 km/h';
      sectorActual = `Entregado en ${geoDestino.nombre}`;
      mensajeEstadoPrincipal = idioma === 'es'
        ? `Tu pedido ha sido entregado exitosamente a ${encomienda.nombredestinatario} el ${formatFecha(encomienda.fecharegistro, idioma)}. ¡Que disfrutes tu compra!`
        : `Your order was successfully delivered to ${encomienda.nombredestinatario} on ${formatFecha(encomienda.fecharegistro, idioma)}. Enjoy your package!`;
      break;
    case 'DEVUELTA':
      pasoActivo = 3;
      factorProgreso = 0.5;
      sectorActual = `Proceso de devolución`;
      mensajeEstadoPrincipal = idioma === 'es'
        ? `La encomienda se encuentra en proceso de devolución. Para más información acércate a la oficina de Cootranar.`
        : `The parcel is in return process. Please contact Cootranar customer service for assistance.`;
      break;
    default:
      pasoActivo = 3;
      factorProgreso = 0.5;
      sectorActual = `En proceso`;
      mensajeEstadoPrincipal = `Estado actual: ${encomienda.estado}`;
  }

  const currentLat = geoOrigen.lat + (geoDestino.lat - geoOrigen.lat) * factorProgreso;
  const currentLng = geoOrigen.lng + (geoDestino.lng - geoOrigen.lng) * factorProgreso;

  const embedGpsUrl = `https://maps.google.com/maps?q=${currentLat.toFixed(5)},${currentLng.toFixed(5)}&t=m&z=11&ie=UTF8&iwloc=&output=embed`;
  const gmapsRutaUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(geoOrigen.nombre + ', Colombia')}&destination=${encodeURIComponent(geoDestino.nombre + ', Colombia')}`;
  const wazeGpsUrl = `https://waze.com/ul?ll=${currentLat.toFixed(5)},${currentLng.toFixed(5)}&navigate=yes`;

  const handleCompartirTracking = async () => {
    const textoShare = `Seguimiento de Envío Cootranar OS ${encomienda.referenciaencomienda} (${origen.ciudad} ➔ ${destino.ciudad}): ${window.location.origin}${ROUTES.MIS_ENCOMIENDAS}?ref=${encomienda.referenciaencomienda}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tracking Cootranar OS ${encomienda.referenciaencomienda}`,
          text: textoShare,
          url: `${window.location.origin}${ROUTES.MIS_ENCOMIENDAS}?ref=${encomienda.referenciaencomienda}`,
        });
        setCompartidoTracking(true);
        setTimeout(() => setCompartidoTracking(false), 2500);
        return;
      } catch {
        // Fallback a clipboard
      }
    }
    navigator.clipboard.writeText(textoShare);
    setCompartidoTracking(true);
    setTimeout(() => setCompartidoTracking(false), 2500);
  };

  const pasosTracking = [
    { step: 1, label: m.paso1Preparacion || 'En Preparación', icon: 'inventory_2' },
    { step: 2, label: m.paso2Admision || 'Admisión Punto Cootranar', icon: 'store' },
    { step: 3, label: m.paso3Retiro || 'Retiro', icon: 'outbox' },
    { step: 4, label: m.paso4Transito || 'En Tránsito', icon: 'local_shipping' },
    { step: 5, label: m.paso5Reparto || 'En Reparto', icon: 'pin_drop' },
    { step: 6, label: m.paso6Entregado || 'Entregado', icon: 'task_alt' },
  ];

  // Oficina seleccionada para la pestaña de Oficinas
  const oficinaActual = tabActiva === 'OFICINA_ORIGEN'
    ? {
        titulo: `${idioma === 'es' ? 'Oficina Origen' : 'Origin Office'} · ${origen.ciudad}`,
        ciudad: origen.ciudad,
        direccion: origen.detalle,
        tipo: 'ORIGEN' as const,
      }
    : {
        titulo: `${idioma === 'es' ? 'Oficina Destino' : 'Destination Office'} · ${destino.ciudad}`,
        ciudad: destino.ciudad,
        direccion: destino.detalle,
        tipo: 'DESTINO' as const,
      };

  const consultaOficina = `Cootranar Encomiendas ${oficinaActual.direccion ? oficinaActual.direccion + ', ' : ''}${oficinaActual.ciudad}, Colombia`.trim();
  const encodedQueryOficina = encodeURIComponent(consultaOficina);
  const embedOficinaUrl = `https://maps.google.com/maps?q=${encodedQueryOficina}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const gmapsOficinaUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQueryOficina}`;
  const wazeOficinaUrl = `https://waze.com/ul?q=${encodedQueryOficina}`;

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* ── Botón Volver y Barra Superior ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-700/80 hover:bg-[#0e3a8c] hover:text-white dark:hover:bg-blue-600 text-[#0e3a8c] dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Volver a la lista"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {m.codigoReferencia}
              </span>
              <span className="font-mono text-base sm:text-xl font-black text-[#0e3a8c] dark:text-blue-400">
                {encomienda.referenciaencomienda}
              </span>
              <button
                onClick={handleCopiarRef}
                title={m.copiarCodigo}
                className="p-1 rounded-md bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">
                  {copiadoRef ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              <span>{origen.ciudad} ➔ {destino.ciudad}</span>
              <span className="mx-1.5">·</span>
              <span>{formatFecha(encomienda.fecharegistro, idioma)}</span>
            </p>
          </div>
        </div>

        {/* Estado badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${st.bg} ${st.text} ${st.border}`}>
            <span className={`w-2 h-2 rounded-full ${st.dot}`} />
            <span className="material-symbols-outlined text-sm">{st.icon}</span>
            <span>{estadoLabel[encomienda.estado] ?? encomienda.estado}</span>
          </span>
          {encomienda.esdomicilio && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              <span className="material-symbols-outlined text-xs">home</span>
              {m.domicilioBadge}
            </span>
          )}
        </div>
      </div>

      {/* ── Selector Menú Hamburguesa para Móviles (sm:hidden) ── */}
      <div className="sm:hidden relative">
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs text-left cursor-pointer transition-all active:scale-99"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
              <span className="material-symbols-outlined text-lg">
                {tabActiva === 'GPS' ? 'route' : tabActiva === 'INFO' ? 'qr_code_2' : 'store'}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-tight">
                {idioma === 'es' ? 'Vista activa' : 'Active view'}
              </span>
              <span className="text-xs font-black text-[#0e3a8c] dark:text-blue-400 truncate block mt-0.5">
                {tabActiva === 'GPS'
                  ? (m.rastreoGpsTitulo || 'Seguimiento de Encomienda')
                  : tabActiva === 'INFO'
                  ? (m.infoCompletaTitulo || 'Detalles y Código QR')
                  : (m.mapaOficinaTitulo || 'Sedes y Oficinas')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-2 shrink-0">
            <span className="text-[11px] font-black text-[#0e3a8c] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 border border-blue-200/70 dark:border-blue-800/60 px-2.5 py-1 rounded-lg">
              {idioma === 'es' ? 'Opciones' : 'Options'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200">
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: menuMovilAbierto ? 'rotate(90deg)' : 'none' }}>
                menu
              </span>
            </div>
          </div>
        </button>

        {/* Dropdown flotante con las opciones del menú hamburguesa */}
        {menuMovilAbierto && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setMenuMovilAbierto(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-xl z-30 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => { setTabActiva('GPS'); setMenuMovilAbierto(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tabActiva === 'GPS'
                    ? 'bg-[#0e3a8c] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base">route</span>
                  <span>{m.rastreoGpsTitulo || 'Seguimiento de Encomienda'}</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${tabActiva === 'GPS' ? 'bg-emerald-300' : 'bg-emerald-500'} animate-ping`} />
              </button>

              <button
                type="button"
                onClick={() => { setTabActiva('INFO'); setMenuMovilAbierto(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tabActiva === 'INFO'
                    ? 'bg-[#0e3a8c] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">qr_code_2</span>
                <span>{m.infoCompletaTitulo || 'Detalles y Código QR'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setTabActiva('OFICINA_ORIGEN'); setMenuMovilAbierto(false); }}
                className={`w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tabActiva === 'OFICINA_ORIGEN' || tabActiva === 'OFICINA_DESTINO'
                    ? 'bg-[#0e3a8c] text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">store</span>
                <span>{m.mapaOficinaTitulo || 'Sedes y Oficinas'}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Pestañas Horizontales para Pantallas Medianas y Grandes (hidden sm:flex) ── */}
      <div className="hidden sm:flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTabActiva('GPS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            tabActiva === 'GPS'
              ? 'bg-[#0e3a8c] text-white shadow-sm shadow-blue-900/10'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#0e3a8c] hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">route</span>
          <span>{m.rastreoGpsTitulo || 'Seguimiento de Encomienda'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
        </button>

        <button
          onClick={() => setTabActiva('INFO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            tabActiva === 'INFO'
              ? 'bg-[#0e3a8c] text-white shadow-sm shadow-blue-900/10'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#0e3a8c] hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">qr_code_2</span>
          <span>{m.infoCompletaTitulo || 'Detalles y Código QR'}</span>
        </button>

        <button
          onClick={() => setTabActiva('OFICINA_ORIGEN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            tabActiva === 'OFICINA_ORIGEN' || tabActiva === 'OFICINA_DESTINO'
              ? 'bg-[#0e3a8c] text-white shadow-sm shadow-blue-900/10'
              : 'text-slate-600 dark:text-slate-300 hover:text-[#0e3a8c] hover:bg-white/80 dark:hover:bg-slate-700/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">store</span>
          <span>{m.mapaOficinaTitulo || 'Sedes y Oficinas'}</span>
        </button>
      </div>

      {/* ── CONTENIDO: Pestaña 1 - Seguimiento Online Estilo Imagen de Referencia ── */}
      {tabActiva === 'GPS' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-8 shadow-xs space-y-7 animate-in fade-in duration-200">
          
          {/* Header Superior: Información del envío OS [Código] + Botón Compartir tracking */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/70">
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 flex-wrap">
                <span>{m.infoEnvioOS || 'Información del envío'}</span>
                <span className="font-mono text-[#f26522] dark:text-orange-400 font-black">
                  OS {encomienda.referenciaencomienda}
                </span>
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {origen.ciudad} ➔ {destino.ciudad} · {formatFecha(encomienda.fecharegistro, idioma)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCompartirTracking}
                className="inline-flex items-center justify-center gap-2 bg-[#f26522] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-base">share</span>
                <span>{compartidoTracking ? (m.trackingCopiado || '¡Enlace copiado!') : (m.compartirTracking || 'Compartir tracking')}</span>
              </button>
            </div>
          </div>

          {/* ── Línea de Tiempo / Stepper de 6 Hitos Idéntica a la Imagen ── */}
          <div className="py-4 overflow-x-auto scrollbar-none">
            <div className="min-w-[640px] px-4">
              
              {/* Contenedor relativo para la línea horizontal y los círculos */}
              <div className="relative flex items-center justify-between">
                
                {/* Línea horizontal base de fondo */}
                <div className="absolute top-[28px] left-[35px] right-[35px] h-[3px] bg-slate-200 dark:bg-slate-700 z-0" />
                
                {/* Línea horizontal de progreso activo (naranja / azul) */}
                <div
                  className="absolute top-[28px] left-[35px] h-[3px] bg-gradient-to-r from-[#f26522] to-[#0e3a8c] dark:from-orange-500 dark:to-blue-400 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((pasoActivo - 1) / (pasosTracking.length - 1)) * 100))}%`,
                  }}
                />

                {/* Los 6 pasos circulares con sus etiquetas */}
                {pasosTracking.map((paso) => {
                  const esCompletado = paso.step < pasoActivo;
                  const esActual = paso.step === pasoActivo;

                  return (
                    <div key={paso.step} className="flex flex-col items-center text-center relative z-10 w-24">
                      
                      {/* Título superior del paso */}
                      <span
                        className={`text-[11px] sm:text-xs font-bold mb-3 h-8 flex items-center justify-center leading-tight transition-colors ${
                          esActual
                            ? 'text-slate-900 dark:text-slate-100 font-extrabold'
                            : esCompletado
                            ? 'text-slate-700 dark:text-slate-300 font-semibold'
                            : 'text-slate-400 dark:text-slate-500 font-medium'
                        }`}
                      >
                        {paso.label}
                      </span>

                      {/* Círculo con Icono */}
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                          esActual
                            ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/60 scale-110'
                            : esCompletado
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-2 border-blue-200 dark:border-blue-800 text-[#0e3a8c] dark:text-blue-400'
                            : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 shadow-2xs'
                        }`}
                      >
                        <span className={`material-symbols-outlined ${esActual ? 'text-2xl animate-pulse' : 'text-xl'}`}>
                          {paso.icon}
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          </div>

          {/* ── Mensaje Descriptivo Contextual del Estado Actual (Burbuja inferior) ── */}
          <div className="bg-slate-50 dark:bg-slate-900/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100/80 dark:bg-blue-950/90 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <span className="material-symbols-outlined text-xl">info</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {mensajeEstadoPrincipal}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <button
                    onClick={() => setTabActiva('INFO')}
                    className="text-[#0e3a8c] dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{m.verPruebaEntrega || 'Ver comprobante / código QR'}</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle Mapa Satelital GPS */}
            <button
              type="button"
              onClick={() => setMostrarMapaDetallado(!mostrarMapaDetallado)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">
                {mostrarMapaDetallado ? 'visibility_off' : 'map'}
              </span>
              <span>{mostrarMapaDetallado ? (idioma === 'es' ? 'Ocultar mapa satelital' : 'Hide satellite map') : (idioma === 'es' ? 'Ver mapa satelital GPS' : 'View live GPS map')}</span>
            </button>
          </div>

          {/* ── Mapa y Telemetría Satelital Opcional Desplegable ── */}
          {mostrarMapaDetallado && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1">
                    <span className="material-symbols-outlined text-xs text-blue-600 dark:text-blue-400">speed</span>
                    <span>{m.velocidadEstimada || 'Velocidad'}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{velocidad}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1">
                    <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">satellite</span>
                    <span>{m.precisioGps || 'Señal Satelital'}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">&lt; 4.5m (8 Sat)</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 col-span-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-amber-500">my_location</span>
                      <span>{m.ubicacionActual || 'Ubicación'}</span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">{ultimaSenalGps}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={sectorActual}>
                    {sectorActual}
                  </p>
                </div>
              </div>

              {/* Mapa Iframe */}
              <div className="relative w-full h-[300px] sm:h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-900">
                <iframe
                  title={`Rastreo GPS ${encomienda.referenciaencomienda}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={embedGpsUrl}
                  className="w-full h-full"
                />
              </div>

              {/* Botones externos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={gmapsRutaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#0e3a8c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-base">directions</span>
                  <span>{m.abrirGoogleMaps || 'Ver Ruta Completa en Google Maps'}</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>

                <a
                  href={wazeGpsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-[#0e3a8c] dark:text-blue-300 border border-blue-200/80 dark:border-slate-600 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-base">near_me</span>
                  <span>{m.abrirWaze || 'Navegar hacia el Punto con Waze'}</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            </div>
          )}

        </div>
      )}


      {/* ── CONTENIDO: Pestaña 2 - Información y Código QR ── */}
      {tabActiva === 'INFO' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
          
          {/* QR & Referencia Banner */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-900/80 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-sm shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Encomienda" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
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
                <span className="font-mono text-xl sm:text-3xl font-black text-[#0e3a8c] dark:text-blue-400 tracking-wider">
                  {encomienda.referenciaencomienda}
                </span>
                <button
                  onClick={handleCopiarRef}
                  title={m.copiarCodigo}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiadoRef ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              {copiadoRef && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {m.codigoCopiado}
                </span>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md pt-1">
                {m.instruccionQr || 'Presenta este código QR o la referencia en la oficina de Cootranar para gestionar tu paquete.'}
              </p>
            </div>
          </div>

          {/* Grilla de Datos de la Encomienda */}
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

        </div>
      )}

      {/* ── CONTENIDO: Pestaña 3 - Sedes y Oficinas Cootranar ── */}
      {(tabActiva === 'OFICINA_ORIGEN' || tabActiva === 'OFICINA_DESTINO') && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-200">
          
          {/* Sub-selector Origen / Destino */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            <button
              onClick={() => setTabActiva('OFICINA_ORIGEN')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tabActiva === 'OFICINA_ORIGEN'
                  ? 'bg-white dark:bg-slate-800 text-[#0e3a8c] dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0e3a8c] dark:bg-blue-400" />
              <span>{m.oficinaOrigen || 'Oficina Origen'}: {origen.ciudad}</span>
            </button>

            <button
              onClick={() => setTabActiva('OFICINA_DESTINO')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tabActiva === 'OFICINA_DESTINO'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{m.oficinaDestino || 'Oficina Destino'}: {destino.ciudad}</span>
            </button>
          </div>

          {/* Tarjeta de Dirección */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                store
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {oficinaActual.titulo}
                </p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {oficinaActual.direccion || (idioma === 'es' ? `Terminal / Oficina Principal de ${oficinaActual.ciudad}` : `Main Terminal / Office of ${oficinaActual.ciudad}`)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {oficinaActual.ciudad}, Colombia
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopiarDireccion(`${oficinaActual.direccion ? oficinaActual.direccion + ', ' : ''}${oficinaActual.ciudad}, Colombia`)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-sm">
                {copiadoDir ? 'check' : 'content_copy'}
              </span>
              <span>{copiadoDir ? (m.direccionCopiada || 'Copiada') : (m.copiarDireccion || 'Copiar dirección')}</span>
            </button>
          </div>

          {/* Mapa Embed Iframe */}
          <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-900">
            <iframe
              title={`Mapa Sede ${oficinaActual.ciudad}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={embedOficinaUrl}
              className="w-full h-full"
            />
          </div>

          {/* Botones de Navegación Externa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={gmapsOficinaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0e3a8c] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">explore</span>
              <span>{m.abrirGoogleMaps || 'Abrir en Google Maps'}</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>

            <a
              href={wazeOficinaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-[#0e3a8c] dark:text-blue-300 border border-blue-200/80 dark:border-slate-600 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">near_me</span>
              <span>{m.abrirWaze || 'Abrir en Waze'}</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          </div>


        </div>
      )}

    </div>
  );
}

// ─── Componente Tarjeta de Encomienda en el Historial ──────────────────────────

function TarjetaEncomienda({
  encomienda,
  onVerDetalles,
  onVerGps,
  onVerMapa,
}: {
  encomienda: EncomiendaAPI;
  onVerDetalles: (enc: EncomiendaAPI) => void;
  onVerGps: (enc: EncomiendaAPI) => void;
  onVerMapa: (enc: EncomiendaAPI, tipo: 'ORIGEN' | 'DESTINO') => void;
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
              className="ml-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-600 cursor-pointer"
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
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#0e3a8c] dark:bg-blue-400 flex-shrink-0" />
                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 truncate" title={origen.ciudad}>
                  {origen.ciudad}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onVerMapa(encomienda, 'ORIGEN')}
                title={`${m.verEnMapa || 'Ver en mapa'}: ${origen.ciudad}`}
                className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors flex-shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] block">pin_drop</span>
              </button>
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
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 truncate" title={destino.ciudad}>
                  {destino.ciudad}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onVerMapa(encomienda, 'DESTINO')}
                title={`${m.verEnMapa || 'Ver en mapa'}: ${destino.ciudad}`}
                className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors flex-shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] block">pin_drop</span>
              </button>
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

      {/* ── Fila Inferior: Valor + Botones de Acción (GPS y Detalle) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
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

        <div className="flex items-center gap-2">
          {/* Botón Rastreo GPS */}
          <button
            type="button"
            onClick={() => onVerGps(encomienda)}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0e3a8c] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400 animate-pulse">radar</span>
            <span>{m.rastrearGps || 'Rastrear GPS'}</span>
          </button>

          {/* Botón Ver Info Completa */}
          <button
            onClick={() => onVerDetalles(encomienda)}
            className="inline-flex items-center gap-1.5 bg-[#0e3a8c] hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:gap-2 active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">qr_code_2</span>
            <span>{m.verInfoCompleta}</span>
          </button>

        </div>
      </div>

    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export function MisEncomiendasPage() {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;
  const [searchParams, setSearchParams] = useSearchParams();

  const [encomiendas, setEncomiendas] = useState<EncomiendaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Input de búsqueda rápida de orden de servicio (OS)
  const [trackingInput, setTrackingInput] = useState('');
  const [errorTrackingDirecto, setErrorTrackingDirecto] = useState('');

  // Filtros
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');

  // Vista en la misma página: Encomienda activa seleccionada y su pestaña
  const [encomiendaActiva, setEncomiendaActiva] = useState<EncomiendaAPI | null>(null);
  const [tabActiva, setTabActiva] = useState<TabDetalle>('GPS');

  const handleAbrirDetalle = (enc: EncomiendaAPI, tab: TabDetalle = 'INFO') => {
    setEncomiendaActiva(enc);
    setTabActiva(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbrirGps = (enc: EncomiendaAPI) => {
    setEncomiendaActiva(enc);
    setTabActiva('GPS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbrirMapaOficina = (enc: EncomiendaAPI, tipo: 'ORIGEN' | 'DESTINO') => {
    setEncomiendaActiva(enc);
    setTabActiva(tipo === 'ORIGEN' ? 'OFICINA_ORIGEN' : 'OFICINA_DESTINO');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuscarTrackingDirecto = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTrackingDirecto('');
    const query = trackingInput.trim().toLowerCase();
    if (!query) return;

    const encontrada = encomiendas.find(
      (enc) =>
        (enc.referenciaencomienda ?? '').toLowerCase() === query ||
        String(enc.idencomienda) === query
    );

    if (encontrada) {
      handleAbrirGps(encontrada);
    } else {
      // Si no coincide exactamente, aplicar filtro en el listado
      setCodigoBusqueda(trackingInput.trim());
      setErrorTrackingDirecto(
        idioma === 'es'
          ? `No se encontró la orden "${trackingInput}". Mostrando coincidencias en el historial.`
          : `Order "${trackingInput}" not found exactly. Showing matches in history.`
      );
    }
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
      .then((res) => {
        setEncomiendas(res.encomiendas);
        // Comprobar si viene referencia por URL (?ref=...)
        const refUrl = searchParams.get('ref');
        if (refUrl) {
          const encRef = res.encomiendas.find(
            (e) => (e.referenciaencomienda ?? '').toLowerCase() === refUrl.toLowerCase()
          );
          if (encRef) {
            setEncomiendaActiva(encRef);
            setTabActiva('GPS');
          }
        }
      })
      .catch(() => setError(idioma === 'es' ? 'No se pudieron cargar tus encomiendas. Intenta de nuevo.' : 'Could not load your parcels. Please try again.'))
      .finally(() => setLoading(false));
  }, [idioma, searchParams]);

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

      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Breadcrumb dinámico */}
        <nav className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link to={ROUTES.HOME} className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors uppercase">
            {tx.navbar.home}
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          {encomiendaActiva ? (
            <>
              <button
                onClick={() => {
                  setEncomiendaActiva(null);
                  if (searchParams.get('ref')) {
                    setSearchParams({});
                  }
                }}
                className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors uppercase cursor-pointer"
              >
                {m.titulo}
              </button>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[#0e3a8c] dark:text-blue-400 uppercase font-black font-mono">
                {encomiendaActiva.referenciaencomienda}
              </span>
            </>
          ) : (
            <span className="text-[#0e3a8c] dark:text-slate-200 uppercase font-extrabold">{m.titulo}</span>
          )}
        </nav>

        {/* ── Si hay una encomienda seleccionada, mostrar la vista integrada en la misma página ── */}
        {encomiendaActiva ? (
          <VistaDetalleEncomienda
            encomienda={encomiendaActiva}
            tabInicial={tabActiva}
            onVolver={() => {
              setEncomiendaActiva(null);
              if (searchParams.get('ref')) {
                setSearchParams({});
              }
            }}
          />
        ) : (
          /* ── Vista Normal: Historial y Buscador de Seguimiento Online ── */
          <>
            {/* ── Tarjeta Superior: Realiza tu seguimiento en línea (Idéntica a la Imagen de Referencia) ── */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-7 mb-7 shadow-xs">
              <div className="max-w-2xl">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1">
                  {m.seguimientoEnLinea || 'Realiza tu seguimiento en línea'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">
                  {m.ingresaOrdenServicio || 'Ingresa tu número de orden de servicio (OS) o código de referencia'}
                </p>

                <form onSubmit={handleBuscarTrackingDirecto} className="flex flex-col sm:flex-row items-stretch gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="ej. 8013052235 o GOBK12M62S"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        setErrorTrackingDirecto('');
                      }}
                      className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 font-mono text-sm sm:text-base font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-[#f26522] focus:border-[#f26522] outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-12 px-7 rounded-xl bg-[#f26522] hover:bg-[#ea580c] text-white font-black text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">search</span>
                    <span>{m.buscarEnvio || 'Buscar envío'}</span>
                  </button>
                </form>

                {errorTrackingDirecto && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-2.5 flex items-center gap-1.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>{errorTrackingDirecto}</span>
                  </p>
                )}

                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-2">
                  {m.largoDigitos || 'Tiene un largo de 8 a 13 dígitos o código de referencia.'}
                </p>
              </div>
            </div>

            {/* Encabezado del Historial y Acciones */}
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
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
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
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
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
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
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-[#0e3a8c] dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm cursor-pointer"
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
                    onVerDetalles={(item) => handleAbrirDetalle(item, 'INFO')}
                    onVerGps={(item) => handleAbrirGps(item)}
                    onVerMapa={(item, tipo) => handleAbrirMapaOficina(item, tipo)}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
