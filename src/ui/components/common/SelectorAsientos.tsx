// Tipos de estado que puede tener un asiento
type EstadoAsiento = 'disponible' | 'ocupado' | 'reservado' | 'seleccionado';

interface Asiento {
  numero: number;
  estado: EstadoAsiento;
}

interface Props {
  asientos: Asiento[];
  onSeleccionar: (numero: number) => void;
}

// Colores según el estado del asiento
const estilosPorEstado: Record<EstadoAsiento, string> = {
  disponible: 'bg-white border-2 border-slate-200 text-slate-700 hover:border-[#0e3a8c] hover:text-[#0e3a8c] cursor-pointer',
  ocupado: 'bg-[#0e3a8c] border-2 border-[#0e3a8c] text-white cursor-not-allowed',
  reservado: 'bg-yellow-400 border-2 border-yellow-400 text-white cursor-not-allowed',
  seleccionado: 'bg-green-500 border-2 border-green-500 text-white cursor-pointer',
};

export function SelectorAsientos({ asientos, onSeleccionar }: Props) {
  // Dividimos los asientos en filas de 4 (2 a cada lado del pasillo)
  // Columnas: [1, 2] | pasillo | [3, 4]
  const filas: Asiento[][] = [];
  for (let i = 0; i < asientos.length; i += 4) {
    filas.push(asientos.slice(i, i + 4));
  }

  const handleClick = (asiento: Asiento) => {
    if (asiento.estado === 'ocupado' || asiento.estado === 'reservado') return;
    onSeleccionar(asiento.numero);
  };

  return (
    <div className="bg-[#f6f6f8] rounded-3xl p-6 w-full max-w-sm mx-auto">
      {/* Parte delantera del bus */}
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
      <div className="space-y-3">
        {filas.map((fila, indexFila) => (
          <div key={indexFila} className="flex items-center gap-2 justify-center">
            {/* Lado izquierdo: columnas 1 y 2 */}
            <div className="flex gap-2">
              {fila.slice(0, 2).map((asiento) => (
                <button
                  key={asiento.numero}
                  onClick={() => handleClick(asiento)}
                  disabled={asiento.estado === 'ocupado' || asiento.estado === 'reservado'}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${estilosPorEstado[asiento.estado]}`}
                >
                  {asiento.numero}
                </button>
              ))}
            </div>

            {/* Pasillo */}
            <div className="w-6" />

            {/* Lado derecho: columnas 3 y 4 */}
            <div className="flex gap-2">
              {fila.slice(2, 4).map((asiento) => (
                <button
                  key={asiento.numero}
                  onClick={() => handleClick(asiento)}
                  disabled={asiento.estado === 'ocupado' || asiento.estado === 'reservado'}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${estilosPorEstado[asiento.estado]}`}
                >
                  {asiento.numero}
                </button>
              ))}
            </div>
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
