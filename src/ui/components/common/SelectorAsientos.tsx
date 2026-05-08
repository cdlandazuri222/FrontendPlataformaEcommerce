export type EstadoAsiento = 'LIBRE' | 'OCUPADO' | 'RESERVADO' | 'SELECCIONADO';

export interface AsientoConEstado {
  idasientoviaje: number;
  numeroasiento: number;
  piso: number;
  espoltrona: boolean;
  estado: EstadoAsiento;
  precio: number | null;
}

interface CeldaDistribucion {
  id: number;
  vacio: boolean;
  esBano: boolean;
  numero: number | null;
  esPasillo: boolean;
  esPoltrona: boolean;
}

interface DistribucionAsientos {
  columnas: number;
  distribucion: CeldaDistribucion[];
}

interface Props {
  distribucion: DistribucionAsientos;
  asientos: AsientoConEstado[];
  onSeleccionar: (asiento: AsientoConEstado) => void;
}

const estilosPorEstado: Record<EstadoAsiento, string> = {
  LIBRE:       'bg-white border-2 border-slate-200 text-slate-700 hover:border-[#0e3a8c] hover:text-[#0e3a8c] cursor-pointer',
  OCUPADO:     'bg-[#0e3a8c] border-2 border-[#0e3a8c] text-white cursor-not-allowed opacity-80',
  RESERVADO:   'bg-yellow-400 border-2 border-yellow-400 text-white cursor-not-allowed',
  SELECCIONADO:'bg-green-500 border-2 border-green-500 text-white cursor-pointer',
};

export function SelectorAsientos({ distribucion, asientos, onSeleccionar }: Props) {
  // Mapa rápido numero → asiento con estado
  const mapaAsientos = new Map<number, AsientoConEstado>();
  for (const a of asientos) mapaAsientos.set(a.numeroasiento, a);

  const { columnas, distribucion: celdas } = distribucion;

  // Dividir en filas según columnas
  const filas: CeldaDistribucion[][] = [];
  for (let i = 0; i < celdas.length; i += columnas) {
    filas.push(celdas.slice(i, i + columnas));
  }

  return (
    <div className="bg-[#f6f6f8] rounded-3xl p-6 w-full max-w-md mx-auto overflow-x-auto">
      {/* Parte delantera */}
      <div className="flex justify-between items-end mb-6 px-2">
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined text-3xl">person</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Conductor</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined text-2xl">tv</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">TV</span>
        </div>
      </div>

      {/* Filas de asientos */}
      <div className="space-y-2">
        {filas.map((fila, fi) => (
          <div key={fi} className="flex gap-1.5 justify-center">
            {fila.map((celda) => {
              // Celda vacía / pasillo
              if (celda.vacio || celda.esPasillo) {
                return (
                  <div
                    key={celda.id}
                    className={`w-9 h-9 shrink-0 ${celda.esBano ? 'flex items-center justify-center text-slate-300' : ''}`}
                  >
                    {celda.esBano && <span className="material-symbols-outlined text-base">wc</span>}
                  </div>
                );
              }

              // Asiento real
              const asiento = celda.numero != null ? mapaAsientos.get(celda.numero) : undefined;
              if (!asiento) {
                // Asiento sin datos (no debería pasar, pero fallback)
                return (
                  <div key={celda.id} className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    {celda.numero}
                  </div>
                );
              }

              const clickable = asiento.estado === 'LIBRE' || asiento.estado === 'SELECCIONADO';

              return (
                <button
                  key={celda.id}
                  onClick={() => clickable && onSeleccionar(asiento)}
                  disabled={!clickable}
                  title={celda.esPoltrona ? 'Poltrona' : undefined}
                  className={`w-9 h-9 shrink-0 rounded-lg text-xs font-bold transition-all relative ${estilosPorEstado[asiento.estado]}`}
                >
                  {celda.esPoltrona && (
                    <span className="absolute -top-1 -right-1 text-[8px] leading-none">★</span>
                  )}
                  {asiento.numeroasiento}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Parte trasera */}
      <div className="mt-6 flex justify-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-4 py-1.5 rounded-full">
          Parte trasera
        </span>
      </div>
    </div>
  );
}
