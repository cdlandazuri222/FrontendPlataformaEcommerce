import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { ROUTES } from '../../../shared/constants';

// Tipos
interface Viaje {
  id: number;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: 'Próximo' | 'Completado' | 'Cancelado';
  codigo: string;
  tipoBus: string;
}

// Datos de ejemplo
const VIAJES: Viaje[] = [
  {
    id: 1,
    origen: 'Pasto',
    destino: 'Cali',
    fecha: '15 Oct, 2023',
    hora: '08:00 AM',
    precio: 65000,
    estado: 'Próximo',
    codigo: '#TRX-892301',
    tipoBus: 'Buseton Class',
  },
  {
    id: 2,
    origen: 'Cali',
    destino: 'Pasto',
    fecha: '28 Ago, 2023',
    hora: '02:30 PM',
    precio: 70000,
    estado: 'Completado',
    codigo: '#TRX-742199',
    tipoBus: 'Aerovans',
  },
  {
    id: 3,
    origen: 'Pasto',
    destino: 'Ipiales',
    fecha: '10 Ago, 2023',
    hora: '06:00 AM',
    precio: 15000,
    estado: 'Completado',
    codigo: '#TRX-551022',
    tipoBus: 'Supercoot',
  },
];

// Rutas disponibles para el filtro
const RUTAS = ['Todas las rutas', 'Pasto → Cali', 'Cali → Pasto', 'Pasto → Ipiales'];



// Color de fondo de la tarjeta azul según estado tipoBus
const colorTarjeta: Record<string, string> = {
  'Buseton Class': 'bg-[#0f2c73]',
  'Aerovans': 'bg-[#04122d]',
  'Supercoot': 'bg-[#5b7897]',
};

export function MisViajesPage() {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [fechaBusqueda, setFechaBusqueda] = useState('');
  const [rutaSeleccionada, setRutaSeleccionada] = useState('Todas las rutas');

  // Filtrar viajes según los criterios
  const viajesFiltrados = VIAJES.filter((viaje) => {
    const coincideCodigo = viaje.codigo.toLowerCase().includes(codigoBusqueda.toLowerCase());
    const coincideRuta =
      rutaSeleccionada === 'Todas las rutas' ||
      rutaSeleccionada === `${viaje.origen} → ${viaje.destino}`;
    // Filtro de fecha simple: busca si el texto de fecha contiene lo escrito
    const coincideFecha = fechaBusqueda === '' || viaje.fecha.includes(fechaBusqueda);
    return coincideCodigo && coincideRuta && coincideFecha;
  });

  const limpiarFiltros = () => {
    setCodigoBusqueda('');
    setFechaBusqueda('');
    setRutaSeleccionada('Todas las rutas');
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navbar />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <nav className="text-[10px] font-bold tracking-wider text-slate-400 mb-8 flex items-center gap-2 mt-2">
          <Link to={ROUTES.HOME} className="hover:text-[#1b367d] transition-colors uppercase">Inicio</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#1b2b4e] uppercase">Mis Viajes</span>
        </nav>

        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-[32px] font-extrabold text-[#1b2b4e] tracking-tight">Historial de Viajes</h1>
            <span className="bg-[#eef2f9] text-[#1b367d] text-[13px] font-bold px-4 py-1.5 rounded-full">
              {VIAJES.length} Viajes
            </span>
          </div>
          <p className="text-[15px] text-slate-400 font-medium">Revisa cronológicamente los detalles de tus trayectos.</p>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-[2rem] border border-slate-100 px-6 py-5 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Código de tiquete */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wide">Código de Tiquete</label>
              <div className="flex items-center gap-2 border border-slate-200/80 rounded-full px-4 py-2.5 bg-slate-50/50">
                <span className="material-symbols-outlined text-slate-400 text-lg">confirmation_number</span>
                <input
                  type="text"
                  placeholder="Ej. TRX-12345"
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                  className="flex-1 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400 bg-transparent min-w-0"
                />
              </div>
            </div>

            {/* Fecha de viaje */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wide">Fecha de Viaje</label>
              <div className="flex items-center gap-2 border border-slate-200/80 rounded-full px-4 py-2.5 bg-slate-50/50">
                <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
                <input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  value={fechaBusqueda}
                  onChange={(e) => setFechaBusqueda(e.target.value)}
                  className="flex-1 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400 bg-transparent min-w-0"
                />
                <span className="material-symbols-outlined text-slate-400 text-base cursor-pointer">event</span>
              </div>
            </div>

            {/* Ruta */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wide">Ruta</label>
              <div className="flex items-center justify-between border border-slate-200/80 rounded-full px-4 py-2.5 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 text-lg">route</span>
                  <select
                    value={rutaSeleccionada}
                    onChange={(e) => setRutaSeleccionada(e.target.value)}
                    className="flex-1 text-sm font-medium outline-none text-slate-700 bg-transparent appearance-none cursor-pointer min-w-0"
                  >
                    {RUTAS.map((ruta) => (
                      <option key={ruta} value={ruta}>{ruta}</option>
                    ))}
                  </select>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-lg pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center gap-2 self-end">
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 bg-[#1b367d] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-blue-900 transition-colors shadow-md shadow-blue-900/20 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">search</span>
                Buscar
              </button>
              <button
                onClick={limpiarFiltros}
                className="text-xs font-extrabold text-[#1b367d] hover:bg-blue-50 px-4 py-2.5 rounded-full transition-colors uppercase tracking-wider whitespace-nowrap"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de viajes con timeline */}
        {viajesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
            <p className="mt-4 text-slate-400 font-medium">No se encontraron viajes con esos filtros.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-[1.125rem] top-10 bottom-12 w-px border-l-[1.5px] border-dotted border-slate-300 hidden sm:block" />

            <div className="space-y-6">
              {viajesFiltrados.map((viaje) => (
                <div key={viaje.id} className="flex gap-4 sm:gap-8 items-start">

                  {/* Ícono del timeline */}
                  <div className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-full border-[3px] border-[#f6f6f8] bg-[#3e5677] items-center justify-center z-10 mt-6 shadow-sm">
                    <span className="material-symbols-outlined text-white text-[17px]">directions_bus</span>
                  </div>

                  {/* Tarjeta del viaje */}
                  <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row">

                      {/* Panel izquierdo azul: precio y código */}
                      <div className={`${colorTarjeta[viaje.tipoBus] || 'bg-[#0f2c73]'} text-white p-7 sm:w-[15.5rem] flex-shrink-0 flex flex-col justify-center`}>
                        <div className="mb-5 text-center sm:text-left">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 mb-2">{viaje.tipoBus}</p>
                          <p className="text-[28px] font-black tracking-tight leading-none">${viaje.precio.toLocaleString('es-CO')}</p>
                        </div>
                        <div className="text-center sm:text-left mt-2">
                          <p className="text-[11px] font-medium lowercase tracking-wide opacity-80 mb-0.5">código</p>
                          <p className="text-[15px] font-extrabold tracking-wide">{viaje.codigo}</p>
                        </div>
                      </div>

                      {/* Panel central: trayecto */}
                      <div className="flex-1 p-7 flex flex-col justify-center ml-0 sm:ml-2">
                        <p className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 mb-2">Trayecto</p>
                        <div className="flex items-center gap-4 text-[22px] font-black text-[#1b2b4e]">
                          <span>{viaje.origen}</span>
                          <span className="material-symbols-outlined text-[#28c76f] text-[28px]">arrow_right_alt</span>
                          <span>{viaje.destino}</span>
                        </div>
                      </div>

                      {/* Panel derecho: fecha, hora y acciones */}
                      <div className="p-6 flex flex-col justify-between items-center sm:items-end gap-5 sm:w-72">
                        {/* Fecha y hora */}
                        <div className="bg-[#f8f9fc] rounded-[1.25rem] p-5 w-full flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">calendar_month</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] mb-0.5">Fecha</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e]">{viaje.fecha}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#7e95b9] text-[22px]">schedule</span>
                            <div className="flex flex-col">
                              <p className="text-[9px] font-extrabold tracking-widest uppercase text-[#8b9cb6] mb-0.5">Hora</p>
                              <p className="text-[13px] font-bold text-[#1b2b4e]">{viaje.hora}</p>
                            </div>
                          </div>
                        </div>

                        {/* Badge de estado y acciones */}
                        <div className="flex flex-col gap-3 w-full items-end mt-2">
                          <div className="mb-2">
                            <span className={`text-[9px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 ${
                              viaje.estado === 'Próximo' 
                                ? 'bg-[#fff8e6] text-[#ffb020] border-[#ffb020]/20' 
                                : viaje.estado === 'Completado'
                                ? 'bg-[#e8f8f2] text-[#28c76f] border-[#28c76f]/20'
                                : 'bg-red-50 text-red-500 border-red-200'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {viaje.estado}
                            </span>
                          </div>
                          <button className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-wide uppercase text-slate-600 border-[1.5px] border-slate-200 rounded-full px-5 py-3 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all w-full">
                            <span className="material-symbols-outlined text-[17px]">file_download</span>
                            Descargar
                          </button>
                          <button className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-wide uppercase text-slate-600 border-[1.5px] border-slate-200 rounded-full px-5 py-3 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all w-full">
                            <span className="material-symbols-outlined text-[17px]">forward_to_inbox</span>
                            Reenviar al correo
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
