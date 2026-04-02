import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { SelectorAsientos } from '../../components/common/SelectorAsientos';
import { ROUTES } from '../../../shared/constants';
import busCootranar from '../../../assets/busCootranar.png';
import { httpClient } from '../../../infrastructure/api/httpClient';

// Tipos
type EstadoAsiento = 'disponible' | 'ocupado' | 'reservado' | 'seleccionado';

interface Asiento {
  numero: number;
  estado: EstadoAsiento;
}

// Datos del viaje que vienen desde la pantalla anterior (via location.state)
interface ViajeInfo {
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
  placa: string;
  movil: string;
  tipoBus: string;
  servicio: string;
  duracion: string;
  etiqueta: string;
}

// Datos de ejemplo por defecto si no vienen por navegación
const VIAJE_DEFAULT: ViajeInfo = {
  origen: 'Pasto',
  destino: 'Cali',
  fecha: '05 Oct',
  hora: '08:00 AM',
  precio: 120000,
  placa: 'KLO-452',
  movil: '2045',
  tipoBus: 'Buseton',
  servicio: 'Expreso Directo',
  duracion: 'Aprox. 9h 30min',
  etiqueta: 'Línea Imperial 1 Piso',
};

// Generamos 25 asientos con algunos ocupados/reservados de ejemplo
function generarAsientos(): Asiento[] {
  const ocupados = [3, 4, 6, 10, 12, 13, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const reservados = [11];

  return Array.from({ length: 25 }, (_, i) => {
    const numero = i + 1;
    let estado: EstadoAsiento = 'disponible';
    if (ocupados.includes(numero)) estado = 'ocupado';
    if (reservados.includes(numero)) estado = 'reservado';
    return { numero, estado };
  });
}

// Leyenda de colores
const LEYENDA = [
  { label: 'Disponible', color: 'bg-white border-2 border-slate-200' },
  { label: 'Ocupado', color: 'bg-[#0e3a8c]' },
  { label: 'Reservado', color: 'bg-yellow-400' },
  { label: 'Seleccionado', color: 'bg-green-500' },
];

export function SeleccionAsientosPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Tomamos los datos del viaje desde la navegación o usamos los de ejemplo
  const viaje: ViajeInfo = (location.state as ViajeInfo) ?? VIAJE_DEFAULT;

  const [asientos, setAsientos] = useState<Asiento[]>(generarAsientos);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Asientos que el usuario ha seleccionado
  const seleccionados = asientos.filter((a) => a.estado === 'seleccionado');

  const handleSeleccionar = (numero: number) => {
    setErrorMsg(null);
    setAsientos((prev) =>
      prev.map((a) => {
        if (a.numero === numero) {
          // Toggle del asiento clickeado
          return { ...a, estado: a.estado === 'seleccionado' ? 'disponible' : 'seleccionado' };
        }
        // Deseleccionar cualquier otro que estuviera seleccionado
        if (a.estado === 'seleccionado') {
          return { ...a, estado: 'disponible' };
        }
        return a;
      })
    );
  };

  const handleConfirmar = async () => {
    if (seleccionados.length === 0) return;

    setErrorMsg(null);
    setCargando(true);

    try {
      // El backend valida si el usuario ya tiene un tiquete comprado para este viaje
      await httpClient.post('/tiquetes/comprar', {
        viajeId: (viaje as any).id,
        asientoNumero: seleccionados[0].numero,
      });

      navigate(ROUTES.MIS_VIAJES, {
        state: { asientoComprado: seleccionados[0].numero, viaje },
      });
    } catch (error: any) {
      const mensaje =
        error?.response?.data?.message ||
        'No se pudo completar la compra. Intenta de nuevo.';
      setErrorMsg(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const totalPrecio = seleccionados.length * viaje.precio;

  const esMisViajes = location.pathname === ROUTES.MIS_VIAJES;

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <button onClick={() => navigate(ROUTES.HOME)} className="hover:text-[#0e3a8c] transition-colors">
            Inicio
          </button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          {esMisViajes ? (
            <span className="text-[#0e3a8c] font-semibold">Mis Viajes</span>
          ) : (
            <>
              <button onClick={() => navigate(-1)} className="hover:text-[#0e3a8c] transition-colors">
                Resultados
              </button>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[#0e3a8c] font-semibold">Selección de Asientos</span>
            </>
          )}
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-32 md:pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Panel izquierdo: Detalles del viaje */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Título */}
              <div className="p-5 pb-3">
                <p className="text-xs font-bold text-[#0e3a8c] uppercase tracking-widest mb-1">Detalles del Viaje</p>
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                  {viaje.origen}
                  <span className="material-symbols-outlined text-[#0e3a8c] text-xl">arrow_forward</span>
                  {viaje.destino}
                </h2>
              </div>

              {/* Imagen del bus */}
              <div className="relative mx-5 mb-4 rounded-xl overflow-hidden h-40">
                <img src={busCootranar} alt="Bus" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <span className="text-white text-xs font-bold">{viaje.etiqueta}</span>
                </div>
              </div>

              {/* Info del viaje */}
              <div className="px-5 pb-5 space-y-4">
                <InfoItem icon="directions_bus" label="Identificadores" value={`Placa: ${viaje.placa}\nMóvil: ${viaje.movil}`} />
                <InfoItem icon="airline_seat_recline_normal" label="Tipo de Bus" value={`${viaje.tipoBus}\nAire acondicionado, WiFi, Baño`} />
                <InfoItem icon="schedule" label="Itinerario" value={`Salida: ${viaje.hora}\nDuración ${viaje.duracion}`} />
                <InfoItem icon="confirmation_number" label="Servicio" value={viaje.servicio} />
              </div>
            </div>
          </div>

          {/* Panel derecho: Selector de asientos */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
              {/* Encabezado con leyenda */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-extrabold text-slate-800">Selecciona tus asientos</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {LEYENDA.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span className="text-xs text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapa de asientos */}
              <SelectorAsientos asientos={asientos} onSeleccionar={handleSeleccionar} />

              {/* Mensaje de error */}
              {errorMsg && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer: precio y botón confirmar */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {seleccionados.length > 0 ? (
                    <>
                      <p className="text-sm text-slate-500">
                        Has seleccionado <span className="font-bold text-slate-700">{seleccionados.length} asiento{seleccionados.length > 1 ? 's' : ''}</span>
                      </p>
                      <p className="text-2xl font-extrabold text-[#0e3a8c]">
                        ${totalPrecio.toLocaleString('es-CO')} <span className="text-sm font-normal text-slate-400">COP</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Selecciona al menos un asiento</p>
                  )}
                </div>

                <button
                  onClick={handleConfirmar}
                  disabled={seleccionados.length === 0 || cargando}
                  className="flex items-center gap-2 bg-[#0e3a8c] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                >
                  {cargando ? (
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  )}
                  {cargando ? 'Procesando...' : 'Confirmar asiento'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente pequeño para cada fila de info del viaje
function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-slate-100 p-2 rounded-lg shrink-0">
        <span className="material-symbols-outlined text-[#0e3a8c] text-lg">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        {value.split('\n').map((line, i) => (
          <p key={i} className="text-sm text-slate-700 font-medium leading-snug">{line}</p>
        ))}
      </div>
    </div>
  );
}
