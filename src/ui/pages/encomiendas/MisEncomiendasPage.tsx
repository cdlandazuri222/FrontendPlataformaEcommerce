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

// ─── Modal de Rastreo GPS en Tiempo Real ──────────────────────────────────────

function ModalRastreoGPS({
  encomienda,
  onClose,
}: {
  encomienda: EncomiendaAPI | null;
  onClose: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;
  const [actualizando, setActualizando] = useState(false);
  const [ultimaSenal, setUltimaSenal] = useState<string>('En vivo');

  if (!encomienda) return null;

  const origen = parseOficina(encomienda.nombreoficinaorigen, encomienda.idoficinaorigen);
  const destino = parseOficina(encomienda.nombreoficinadestino, encomienda.idoficinadestino);

  const geoOrigen = resolverGeoCiudad(origen.ciudad);
  const geoDestino = resolverGeoCiudad(destino.ciudad);

  // Cálculo de posición GPS según el estado de la encomienda
  let factorProgreso = 0.1;
  let velocidad = '0 km/h';
  let sectorActual = '';
  let estadoDetalle = '';
  let hitoActivo = 1;

  switch (encomienda.estado) {
    case 'COTIZADA':
      factorProgreso = 0.04;
      velocidad = '0 km/h';
      sectorActual = `Oficina de origen en ${geoOrigen.nombre} · Preinscripción`;
      estadoDetalle = idioma === 'es' ? 'En espera de recepción en taquilla Cootranar' : 'Awaiting drop-off at Cootranar office';
      hitoActivo = 1;
      break;
    case 'REGISTRADA':
      factorProgreso = 0.18;
      velocidad = '0 km/h (En patio de carga)';
      sectorActual = `Bodega principal · Agencia Cootranar ${geoOrigen.nombre}`;
      estadoDetalle = idioma === 'es' ? 'Paquete embalado y asignado a vehículo de despacho' : 'Packed and assigned to dispatch vehicle';
      hitoActivo = 1;
      break;
    case 'EN_TRANSITO':
      factorProgreso = 0.62;
      velocidad = '66 km/h (Velocidad de crucero)';
      sectorActual = `Vía Panamericana · Corredor ${geoOrigen.nombre} ➔ ${geoDestino.nombre}`;
      estadoDetalle = idioma === 'es' ? 'En carretera nacional con monitoreo satelital 24/7' : 'On national highway with 24/7 satellite GPS tracking';
      hitoActivo = 2;
      break;
    case 'EN_DESTINO':
      factorProgreso = 0.92;
      velocidad = '0 km/h (En agencia destino)';
      sectorActual = `Agencia Cootranar ${geoDestino.nombre}`;
      estadoDetalle = encomienda.esdomicilio
        ? (idioma === 'es' ? 'En ruta de reparto local a la dirección del destinatario' : 'Out for local delivery to recipient address')
        : (idioma === 'es' ? 'Disponible para retiro en taquilla con documento de identidad' : 'Available for pickup at branch office');
      hitoActivo = 3;
      break;
    case 'ENTREGADA':
      factorProgreso = 1.0;
      velocidad = '0 km/h';
      sectorActual = `Entregado al destinatario en ${geoDestino.nombre}`;
      estadoDetalle = idioma === 'es' ? 'Encomienda entregada a satisfacción' : 'Parcel delivered successfully';
      hitoActivo = 4;
      break;
    default:
      factorProgreso = 0.5;
      sectorActual = `Trayecto ${geoOrigen.nombre} - ${geoDestino.nombre}`;
      estadoDetalle = encomienda.estado;
      hitoActivo = 2;
  }

  const currentLat = geoOrigen.lat + (geoDestino.lat - geoOrigen.lat) * factorProgreso;
  const currentLng = geoOrigen.lng + (geoDestino.lng - geoOrigen.lng) * factorProgreso;

  const embedGpsUrl = `https://maps.google.com/maps?q=${currentLat.toFixed(5)},${currentLng.toFixed(5)}&t=m&z=11&ie=UTF8&iwloc=&output=embed`;
  const gmapsRutaUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(geoOrigen.nombre + ', Colombia')}&destination=${encodeURIComponent(geoDestino.nombre + ', Colombia')}`;
  const wazeGpsUrl = `https://waze.com/ul?ll=${currentLat.toFixed(5)},${currentLng.toFixed(5)}&navigate=yes`;

  const handleRefrescarGps = () => {
    setActualizando(true);
    setTimeout(() => {
      setActualizando(false);
      setUltimaSenal(idioma === 'es' ? 'Actualizado ahora mismo' : 'Updated just now');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl z-10 border border-slate-200/80 dark:border-slate-700/80 transition-all flex flex-col max-h-[94vh] my-auto overflow-hidden">
        {/* Header con Telemetría Satelital */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-2xl animate-pulse">radar</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {m.rastreoGpsTitulo || 'Rastreo GPS en Tiempo Real'}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {m.sateliteActivo || 'GPS Satelital Activo'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span>REF:</span>
                <span className="font-bold text-blue-300">{encomienda.referenciaencomienda}</span>
                <span>·</span>
                <span className="text-slate-300">{origen.ciudad} ➔ {destino.ciudad}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Barra de Progreso del Trayecto */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              <span className="uppercase text-[10px] tracking-wider">{m.puntosRuta || 'Hitos de la Ruta'}</span>
              <span className="text-[#0e3a8c] dark:text-blue-400 font-black">{Math.round(factorProgreso * 100)}% {idioma === 'es' ? 'Completado' : 'Completed'}</span>
            </div>

            {/* Stepper Visual */}
            <div className="grid grid-cols-4 gap-2 relative">
              {[
                { step: 1, label: m.salidaAgencia || 'Origen', icon: 'store' },
                { step: 2, label: m.enCarretera || 'En Ruta', icon: 'local_shipping' },
                { step: 3, label: m.llegadaDestino || 'En Destino', icon: 'pin_drop' },
                { step: 4, label: m.entregado || 'Entregado', icon: 'check_circle' },
              ].map((item) => {
                const activo = hitoActivo >= item.step;
                const actual = hitoActivo === item.step;
                return (
                  <div key={item.step} className="flex flex-col items-center text-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        actual
                          ? 'bg-[#0e3a8c] text-white shadow-md scale-105 ring-2 ring-blue-300 dark:ring-blue-500'
                          : activo
                          ? 'bg-blue-100 dark:bg-blue-950 text-[#0e3a8c] dark:text-blue-300 font-bold'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{item.icon}</span>
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-bold leading-tight ${actual ? 'text-[#0e3a8c] dark:text-blue-400 font-black' : activo ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HUD de Telemetría GPS en Vivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1">
                <span className="material-symbols-outlined text-xs text-blue-600 dark:text-blue-400">speed</span>
                <span>{m.velocidadEstimada || 'Velocidad'}</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{velocidad}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1">
                <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">satellite</span>
                <span>{m.precisioGps || 'Señal'}</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">&lt; 4.5m (8 Sat)</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 col-span-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-amber-500">my_location</span>
                  <span>{m.ubicacionActual || 'Ubicación'}</span>
                </div>
                <button
                  onClick={handleRefrescarGps}
                  disabled={actualizando}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold lowercase"
                >
                  <span className={`material-symbols-outlined text-xs ${actualizando ? 'animate-spin' : ''}`}>sync</span>
                  {actualizando ? 'actualizando...' : ultimaSenal}
                </button>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={sectorActual}>
                {sectorActual}
              </p>
            </div>
          </div>

          {/* Mapa Interactivo con Marker GPS */}
          <div className="relative w-full h-[280px] sm:h-[360px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-800">
            <iframe
              title={`Rastreo GPS Encomienda ${encomienda.referenciaencomienda}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={embedGpsUrl}
              className="w-full h-full"
            />

            {/* Floating Badge en el Mapa */}
            <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 max-w-[85%]">
              <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">
                  {estadoDetalle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Coord: {currentLat.toFixed(4)}° N, {Math.abs(currentLng).toFixed(4)}° W
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Navegación Externa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={gmapsRutaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0e3a8c] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">directions</span>
              <span>Ver Ruta Completa en Google Maps</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>

            <a
              href={wazeGpsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">near_me</span>
              <span>Navegar hacia el Punto con Waze</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Modal de Ubicación de Oficina en Mapa ───────────────────────────────────


export interface OficinaMapaData {
  titulo: string;
  ciudad: string;
  direccion: string;
  tipo: 'ORIGEN' | 'DESTINO' | 'OFICINA';
}

function ModalMapaOficina({
  oficina,
  onClose,
}: {
  oficina: OficinaMapaData | null;
  onClose: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const m = tx.misEncomiendas;
  const [copiado, setCopiado] = useState(false);

  if (!oficina) return null;

  // Consulta optimizada para ubicar la sede de Cootranar
  const consultaUbicacion = `Cootranar Encomiendas ${oficina.direccion ? oficina.direccion + ', ' : ''}${oficina.ciudad}, Colombia`.trim();
  const encodedQuery = encodeURIComponent(consultaUbicacion);
  const embedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedQuery}`;

  const handleCopiarDireccion = () => {
    const texto = `${oficina.direccion ? oficina.direccion + ', ' : ''}${oficina.ciudad}, Colombia`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl z-10 border border-slate-200/80 dark:border-slate-700/80 transition-all flex flex-col max-h-[92vh] my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#0e3a8c] dark:text-blue-400 shrink-0">
              <span className="material-symbols-outlined text-2xl">location_on</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {m.mapaOficinaTitulo || 'Ubicación de Oficina de Encomiendas'}
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  oficina.tipo === 'ORIGEN'
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#0e3a8c] dark:text-blue-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {oficina.tipo === 'ORIGEN' ? (m.oficinaOrigen || 'Origen') : (m.oficinaDestino || 'Destino')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                <span>Cootranar · {oficina.ciudad}</span>
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Info Card con dirección */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-xl text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                store
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {idioma === 'es' ? 'Dirección de la Agencia Cootranar' : 'Cootranar Branch Address'}
                </p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {oficina.direccion || (idioma === 'es' ? `Terminal / Oficina Principal de ${oficina.ciudad}` : `Main Terminal / Office of ${oficina.ciudad}`)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {oficina.ciudad}, Colombia
                </p>
              </div>
            </div>

            <button
              onClick={handleCopiarDireccion}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">
                {copiado ? 'check' : 'content_copy'}
              </span>
              <span>{copiado ? (m.direccionCopiada || 'Copiada') : (m.copiarDireccion || 'Copiar dirección')}</span>
            </button>
          </div>

          {/* Map Embed Iframe */}
          <div className="relative w-full h-[260px] sm:h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-800">
            <iframe
              title={`Mapa Oficina Cootranar ${oficina.ciudad}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={embedUrl}
              className="w-full h-full"
            />
          </div>

          {/* Botones de Acción de Navegación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0e3a8c] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">explore</span>
              <span>{m.abrirGoogleMaps || 'Abrir en Google Maps'}</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">near_me</span>
              <span>{m.abrirWaze || 'Abrir en Waze'}</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  onVerMapa,
  onRastrearGps,
}: {
  encomienda: EncomiendaAPI;
  qrDataUrl: string | null;
  onClose: () => void;
  onVerMapa: (oficina: OficinaMapaData) => void;
  onRastrearGps: (enc: EncomiendaAPI) => void;
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

          {/* Banner de Rastreo Satelital GPS en Tiempo Real */}
          <button
            type="button"
            onClick={() => onRastrearGps(encomienda)}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0e3a8c] via-blue-800 to-indigo-900 hover:from-blue-900 hover:to-indigo-950 text-white shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl animate-pulse text-blue-200">radar</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-black tracking-tight">{m.rastreoGpsTitulo || 'Rastreo GPS en Tiempo Real'}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    GPS En Vivo
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/90 font-medium">
                  {idioma === 'es' ? 'Localiza en el mapa la posición satelital del vehículo y tu paquete' : 'Track satellite position of the vehicle and your parcel'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold bg-white/20 px-3 py-2 rounded-xl group-hover:bg-white group-hover:text-[#0e3a8c] transition-colors shrink-0 shadow-xs">
              <span>{m.rastrearGps || 'Ver GPS'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </button>


          {/* Trayecto / Ruta destacado con botones de ver mapa */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between gap-1.5 text-slate-400 dark:text-slate-500 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">route</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{m.trayecto}</span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                Sedes Cootranar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origen */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between gap-2.5 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {m.oficinaOrigen || 'Oficina Origen'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#0e3a8c] dark:bg-blue-400" />
                  </div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight">
                    {origen.ciudad}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    {origen.detalle || (idioma === 'es' ? 'Oficina Principal de Encomiendas' : 'Main Parcel Office')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onVerMapa({
                    titulo: `${idioma === 'es' ? 'Oficina de Encomiendas' : 'Parcel Office'} - ${origen.ciudad}`,
                    ciudad: origen.ciudad,
                    direccion: origen.detalle,
                    tipo: 'ORIGEN'
                  })}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0e3a8c] dark:text-blue-300 text-xs font-bold transition-all border border-blue-200/60 dark:border-blue-800/50 cursor-pointer shadow-2xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  <span>{m.verEnMapa || 'Ver en mapa'}</span>
                </button>
              </div>

              {/* Destino */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between gap-2.5 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {m.oficinaDestino || 'Oficina Destino'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight">
                    {destino.ciudad}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1">
                    {destino.detalle || (idioma === 'es' ? 'Oficina Principal de Encomiendas' : 'Main Parcel Office')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onVerMapa({
                    titulo: `${idioma === 'es' ? 'Oficina de Encomiendas' : 'Parcel Office'} - ${destino.ciudad}`,
                    ciudad: destino.ciudad,
                    direccion: destino.detalle,
                    tipo: 'DESTINO'
                  })}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all border border-emerald-200/60 dark:border-emerald-800/50 cursor-pointer shadow-2xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  <span>{m.verEnMapa || 'Ver en mapa'}</span>
                </button>
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
  onVerMapa,
  onRastrearGps,
}: {
  encomienda: EncomiendaAPI;
  onVerDetalles: (enc: EncomiendaAPI) => void;
  onVerMapa: (oficina: OficinaMapaData) => void;
  onRastrearGps: (enc: EncomiendaAPI) => void;
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
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#0e3a8c] dark:bg-blue-400 flex-shrink-0" />
                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 truncate" title={origen.ciudad}>
                  {origen.ciudad}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onVerMapa({
                  titulo: `${idioma === 'es' ? 'Oficina Origen' : 'Origin Office'} - ${origen.ciudad}`,
                  ciudad: origen.ciudad,
                  direccion: origen.detalle,
                  tipo: 'ORIGEN'
                })}
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
                onClick={() => onVerMapa({
                  titulo: `${idioma === 'es' ? 'Oficina Destino' : 'Destination Office'} - ${destino.ciudad}`,
                  ciudad: destino.ciudad,
                  direccion: destino.detalle,
                  tipo: 'DESTINO'
                })}
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
            onClick={() => onRastrearGps(encomienda)}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0e3a8c] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400 animate-pulse">radar</span>
            <span>{m.rastrearGps || 'Rastrear GPS'}</span>
          </button>

          {/* Botón Ver Info Completa */}
          <button
            onClick={() => onVerDetalles(encomienda)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-[#0e3a8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:gap-2 active:scale-98 cursor-pointer"
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

  const [encomiendas, setEncomiendas] = useState<EncomiendaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');

  // Modal de información completa (incluye QR)
  const [encomiendaSeleccionada, setEncomiendaSeleccionada] = useState<EncomiendaAPI | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Modal de visualización en Mapa de la sede/oficina Cootranar
  const [oficinaMapa, setOficinaMapa] = useState<OficinaMapaData | null>(null);

  // Modal de Rastreo GPS en Vivo
  const [encomiendaGps, setEncomiendaGps] = useState<EncomiendaAPI | null>(null);

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

      {/* Modal de Información Completa de la Encomienda */}
      {encomiendaSeleccionada && (
        <InfoEncomiendaModal
          encomienda={encomiendaSeleccionada}
          qrDataUrl={qrDataUrl}
          onClose={() => setEncomiendaSeleccionada(null)}
          onVerMapa={(ofic) => setOficinaMapa(ofic)}
          onRastrearGps={(enc) => setEncomiendaGps(enc)}
        />
      )}

      {/* Modal Interactivo de Mapa de Oficinas Cootranar */}
      {oficinaMapa && (
        <ModalMapaOficina
          oficina={oficinaMapa}
          onClose={() => setOficinaMapa(null)}
        />
      )}

      {/* Modal de Rastreo GPS en Tiempo Real */}
      {encomiendaGps && (
        <ModalRastreoGPS
          encomienda={encomiendaGps}
          onClose={() => setEncomiendaGps(null)}
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
                onVerMapa={(ofic) => setOficinaMapa(ofic)}
                onRastrearGps={(encItem) => setEncomiendaGps(encItem)}
              />
            ))}


          </div>
        )}

      </div>
    </div>
  );
}
