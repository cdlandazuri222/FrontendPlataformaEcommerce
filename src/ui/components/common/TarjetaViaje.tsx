import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import type { ViajeAPI } from '../../../infrastructure/api/plataformaEcommerceApi';
import busCootranar from '../../../assets/busCootranar.png';

interface Props {
  viaje: ViajeAPI;
}

export function TarjetaViaje({ viaje }: Props) {
  const navigate = useNavigate();

  const imagen = viaje.imagenDestino ?? busCootranar;
  const etiqueta = viaje.vehiculo.tipobus;
  const origen = viaje.tramoBuscado?.origen ?? viaje.ruta.origen;
  const destino = viaje.tramoBuscado?.destino ?? viaje.ruta.destino;

  const [y, m, d] = (viaje.fechasalida as string).slice(0, 10).split('-').map(Number);
  const fechaLocal = new Date(y, m - 1, d);
  const fecha = fechaLocal.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

  const [hh, mm] = viaje.horasalida.split(':').map(Number);
  const periodo = hh >= 12 ? 'p.m.' : 'a.m.';
  const hora12 = hh % 12 === 0 ? 12 : hh % 12;
  const hora = `${hora12}:${String(mm).padStart(2, '0')} ${periodo}`;
  const asientos = viaje.asientos.libres;
  const precio = viaje.precio.valor;

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={imagen}
          alt={`Bus ${origen} - ${destino}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {etiqueta && (
          <div className="absolute top-3 left-3">
            <span className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
              {etiqueta}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          {viaje.tramoBuscado && (
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Ruta: {viaje.ruta.origen} → {viaje.ruta.destino}
            </p>
          )}
          <div className="flex items-center gap-2 text-lg font-bold">
            <span>{origen}</span>
            <span className="material-symbols-outlined text-[#0e3a8c] text-base">arrow_forward</span>
            <span>{destino}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Fecha Salida</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="material-symbols-outlined text-[#0e3a8c] text-sm">calendar_month</span>
              <span className="font-bold">{fecha}, {hora}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Asientos</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="material-symbols-outlined text-[#0e3a8c] text-sm">airline_seat_recline_normal</span>
              <span className="font-bold">{asientos} Disponibles</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Precio</span>
            <p className="text-xl font-extrabold text-[#0e3a8c]">
              {precio != null ? `$${precio.toLocaleString('es-CO')}` : 'CONSULTAR'}
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.SELECCION_ASIENTOS, {
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
              }
            })}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0e3a8c] text-white rounded-lg font-bold text-xs hover:bg-blue-900 transition-all shadow-md shadow-blue-900/20 text-center"
          >
            Seleccionar Asiento
          </button>
        </div>
      </div>
    </div>
  );
}
