import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';

interface Viaje {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  asientos: number;
  precio: number;
  imagen: string;
  etiqueta?: string;
}

interface Props {
  viaje: Viaje;
}

export function TarjetaViaje({ viaje }: Props) {
  const { origen, destino, fecha, hora, asientos, precio, imagen, etiqueta } = viaje;
  const navigate = useNavigate();

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
        <div className="flex items-center gap-2 text-lg font-bold mb-4">
          <span>{origen}</span>
          <span className="material-symbols-outlined text-[#0e3a8c] text-base">arrow_forward</span>
          <span>{destino}</span>
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
            <p className="text-xl font-extrabold text-[#0e3a8c]">${precio.toLocaleString('es-CO')}</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.SELECCION_ASIENTOS, {
              state: {
                origen,
                destino,
                fecha,
                hora,
                precio,
                placa: 'KLO-452',
                movil: '2045',
                tipoBus: 'Buseton',
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
