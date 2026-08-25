import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import type { ViajeAPI } from '../../../infrastructure/api/plataformaEcommerceApi';
import busCootranar from '../../../assets/busCootranar.png';
import { usePreferencias } from '../../context/PreferenciasContext';

interface Props {
  viaje: ViajeAPI;
}

export function TarjetaViaje({ viaje }: Props) {
  const navigate = useNavigate();
  const { tx, idioma } = usePreferencias();
  const h = tx.home;
  const c = tx.comun;

  const imagen = viaje.imagenDestino ?? busCootranar;
  const etiqueta = viaje.vehiculo.tipobus || 'Estándar';
  const origen = viaje.tramoBuscado?.origen ?? viaje.ruta.origen;
  const destino = viaje.tramoBuscado?.destino ?? viaje.ruta.destino;

  const [y, m, d] = (viaje.fechasalida as string).slice(0, 10).split('-').map(Number);
  const fechaLocal = new Date(y, m - 1, d);
  const fecha = fechaLocal.toLocaleDateString(idioma === 'es' ? 'es-CO' : 'en-US', {
    day: '2-digit',
    month: 'short',
  });

  const [hh, mm] = viaje.horasalida.split(':').map(Number);
  const periodo = hh >= 12 ? 'p.m.' : 'a.m.';
  const hora12 = hh % 12 === 0 ? 12 : hh % 12;
  const hora = `${hora12}:${String(mm).padStart(2, '0')} ${periodo}`;
  const asientos = viaje.asientos.libres;
  const precio = viaje.precio.valor;
  const esPocosAsientos = asientos > 0 && asientos <= 4;
  const esAgotado = asientos === 0;

  const handleSeleccionar = () => {
    navigate(ROUTES.SELECCION_ASIENTOS, {
      state: {
        idviaje: viaje.idviaje,
        origen,
        destino,
        idPuntoOrigen: viaje.tramoBuscado?.idPuntoOrigen ?? null,
        idPuntoDestino: viaje.tramoBuscado?.idPuntoDestino ?? null,
        rutaCompleta: viaje.tramoBuscado
          ? `${viaje.ruta.origen} → ${viaje.ruta.destino}`
          : null,
        fecha,
        hora,
        precio,
        placa: viaje.vehiculo.placa,
        movil: viaje.vehiculo.numeromovil,
        tipoBus: viaje.vehiculo.tipobus,
        servicio: 'Expreso Directo',
        duracion: 'Aprox. 9h 30min',
        etiqueta: etiqueta ?? '',
      },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-blue-900/10 dark:hover:shadow-black/40 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 group">
      {/* ── Top Media Banner (Compact 130px height) ── */}
      <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-slate-900">
        <img
          src={imagen}
          alt={`Bus ${origen} - ${destino}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = busCootranar;
          }}
        />
        {/* Soft gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent pointer-events-none" />

        {/* Bus Type Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-slate-900/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-[13px] text-blue-400">directions_bus</span>
            {etiqueta}
          </span>
        </div>

        {/* Seat Availability Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5">
          {esAgotado ? (
            <span className="bg-red-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[13px]">block</span>
              {idioma === 'es' ? 'Agotado' : 'Sold out'}
            </span>
          ) : esPocosAsientos ? (
            <span className="bg-amber-500/95 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider flex items-center gap-1 shadow-md animate-pulse">
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              {idioma === 'es' ? `¡Últimos ${asientos}!` : `Last ${asientos}!`}
            </span>
          ) : (
            <span className="bg-emerald-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[13px]">airline_seat_recline_normal</span>
              {asientos} {h.disponibles}
            </span>
          )}
        </div>

        {/* Vehicle Unit info (Bottom Left of Image) */}
        <div className="absolute bottom-2 left-3 flex items-center gap-2 text-[11px] font-medium text-white/90 drop-shadow-md">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-blue-300">pin</span>
            Móvil {viaje.vehiculo.numeromovil || 'S/N'}
          </span>
          {viaje.vehiculo.placa && (
            <>
              <span className="text-white/40">•</span>
              <span className="text-[10px] bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                {viaje.vehiculo.placa}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Card Content Body ── */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Route / Cities Header */}
        <div>
          {viaje.tramoBuscado && (
            <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[#0e3a8c] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40 w-fit">
              <span className="material-symbols-outlined text-[12px]">alt_route</span>
              <span>Ruta: {viaje.ruta.origen} → {viaje.ruta.destino}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-extrabold text-slate-800 dark:text-slate-100 text-[15px] sm:text-base leading-tight">
              <span className="truncate max-w-[110px] sm:max-w-[130px]" title={origen}>{origen}</span>
              <div className="flex items-center text-[#0e3a8c] dark:text-blue-400 px-1">
                <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                  trending_flat
                </span>
              </div>
              <span className="truncate max-w-[110px] sm:max-w-[130px]" title={destino}>{destino}</span>
            </div>
          </div>

          {viaje.ruta.via && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Vía: {viaje.ruta.via}
            </p>
          )}
        </div>

        {/* Schedule & Amenities Section */}
        <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
          {/* Departure Date */}
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-none">
                {h.fechaSalida}
              </span>
              <span className="text-xs font-bold truncate mt-0.5 text-slate-800 dark:text-slate-200">
                {fecha}
              </span>
            </div>
          </div>

          {/* Departure Time */}
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm">schedule</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-none">
                {idioma === 'es' ? 'Hora' : 'Time'}
              </span>
              <span className="text-xs font-bold text-[#0e3a8c] dark:text-blue-400 truncate mt-0.5">
                {hora}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Amenities Pill Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] font-semibold" title="Aire Acondicionado">
            <span className="material-symbols-outlined text-[11px] text-blue-500">ac_unit</span>
            A/C
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] font-semibold" title="Rastreo Satelital">
            <span className="material-symbols-outlined text-[11px] text-emerald-500">fmd_good</span>
            GPS
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] font-semibold" title="Asientos Reclinables">
            <span className="material-symbols-outlined text-[11px] text-indigo-500">airline_seat_recline_extra</span>
            Confort
          </span>
        </div>

        {/* ── Footer: Price & Call To Action ── */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">
              {c.precio}
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[#0e3a8c] dark:text-blue-400 tracking-tight leading-tight mt-0.5">
              {precio != null
                ? `$${precio.toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}`
                : 'CONSULTAR'}
            </p>
          </div>

          <button
            onClick={handleSeleccionar}
            disabled={esAgotado}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0 ${
              esAgotado
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#0e3a8c] to-[#1a4ea8] hover:from-[#092b6b] hover:to-[#133d85] dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white shadow-blue-900/20 hover:shadow-blue-900/35 hover:shadow-lg'
            }`}
          >
            <span>{h.seleccionarAsiento}</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

