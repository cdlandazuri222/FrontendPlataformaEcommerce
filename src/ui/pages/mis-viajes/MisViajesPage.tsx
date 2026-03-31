import { Navbar } from '../../components/layout/Navbar';

// Datos de ejemplo de viajes del usuario
const VIAJES_USUARIO = [
  {
    id: 1,
    origen: 'Pasto',
    destino: 'Cali',
    fecha: '05 Oct 2025',
    hora: '08:00 AM',
    asiento: 1,
    precio: 120000,
    estado: 'Confirmado',
    codigo: 'COO-2025-001',
  },
  {
    id: 2,
    origen: 'Ipiales',
    destino: 'Popayán',
    fecha: '10 Oct 2025',
    hora: '18:00 PM',
    asiento: 5,
    precio: 65000,
    estado: 'Pendiente',
    codigo: 'COO-2025-002',
  },
  {
    id: 3,
    origen: 'Pasto',
    destino: 'Bogotá',
    fecha: '01 Sep 2025',
    hora: '08:00 AM',
    asiento: 12,
    precio: 120000,
    estado: 'Usado',
    codigo: 'COO-2025-003',
  },
];

// Colores según el estado del tiquete
const estiloEstado: Record<string, string> = {
  Confirmado: 'bg-green-100 text-green-700',
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Cancelado: 'bg-red-100 text-red-700',
  Usado: 'bg-slate-100 text-slate-500',
};

export function MisViajesPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Mis Viajes</h2>

        {VIAJES_USUARIO.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">confirmation_number</span>
            <p className="mt-4 text-slate-400 font-medium">No tienes viajes registrados aún.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {VIAJES_USUARIO.map((viaje) => (
              <div key={viaje.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info principal */}
                <div className="flex items-center gap-4">
                  <div className="bg-[#0e3a8c]/10 p-3 rounded-xl">
                    <span className="material-symbols-outlined text-[#0e3a8c] text-2xl">directions_bus</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
                      <span>{viaje.origen}</span>
                      <span className="material-symbols-outlined text-[#0e3a8c] text-sm">arrow_forward</span>
                      <span>{viaje.destino}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{viaje.fecha} · {viaje.hora} · Asiento {viaje.asiento}</p>
                    <p className="text-xs text-slate-400">{viaje.codigo}</p>
                  </div>
                </div>

                {/* Precio y estado */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <p className="text-lg font-extrabold text-[#0e3a8c]">${viaje.precio.toLocaleString('es-CO')}</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${estiloEstado[viaje.estado]}`}>
                    {viaje.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
