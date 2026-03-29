// Tarjeta reutilizable para mostrar un viaje disponible
function TarjetaViaje({ viaje }) {
  const { origen, destino, fecha, hora, asientos, precio, imagen, etiqueta } = viaje;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">

      {/* Imagen del bus */}
      <div className="relative">
        <img
          src={imagen}
          alt={`Bus ${origen} - ${destino}`}
          className="w-full h-40 object-cover"
        />
        {etiqueta && (
          <span className="absolute top-3 left-3 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            {etiqueta}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Ruta */}
        <h3 className="text-base font-bold text-slate-800 mb-3">
          {origen} <span className="text-brand-blue">→</span> {destino}
        </h3>

        {/* Fecha y asientos */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-slate-400">calendar_month</span>
            <span>{fecha}, {hora}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-slate-400">chair</span>
            <span>{asientos} Disponibles</span>
          </div>
        </div>

        {/* Precio y botón */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Precio</p>
            <p className="text-xl font-extrabold text-brand-blue">${precio.toLocaleString('es-CO')}</p>
          </div>
          <button className="bg-brand-blue hover:bg-brand-blue-light text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            Seleccionar Puesto
          </button>
        </div>
      </div>
    </div>
  );
}

export default TarjetaViaje;
