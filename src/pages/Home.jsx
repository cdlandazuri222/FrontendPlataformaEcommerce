import { useState } from 'react';
import Navbar from '../components/Navbar';
import TarjetaViaje from '../components/TarjetaViaje';
import busCootranar from '../assets/busCootranar.png';

// Datos de ejemplo (mock data) - después se reemplaza con llamadas al backend
const viajesHoy = [
  {
    id: 1,
    origen: 'Pasto',
    destino: 'Cali',
    fecha: '05 Oct',
    hora: '14:30',
    asientos: 8,
    precio: 85000,
    imagen: busCootranar,
    etiqueta: 'Oferta especial',
  },
  {
    id: 2,
    origen: 'Ipiales',
    destino: 'Popayán',
    fecha: '05 Oct',
    hora: '18:19',
    asientos: 30,
    precio: 65000,
    imagen: busCootranar,
    etiqueta: 'Estándar AL',
  },
  {
    id: 3,
    origen: 'Pasto',
    destino: 'Ipiales',
    fecha: '05 Oct',
    hora: '20:15',
    asientos: 6,
    precio: 45000,
    imagen: busCootranar,
    etiqueta: 'Oferta especial',
  },
];

const viajesProgramados = [
  {
    id: 4,
    origen: 'Pasto',
    destino: 'Bogotá',
    fecha: '06 Oct',
    hora: '08:00',
    asientos: 16,
    precio: 120000,
    imagen: busCootranar,
    etiqueta: 'Largo plazo',
  },
];

function Home() {
  const [busqueda, setBusqueda] = useState({
    origen: '',
    destino: '',
    fecha: '',
  });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtros, setFiltros] = useState({
    horaSalida: '',
    tipoBus: '',
  });

  const handleBusqueda = (e) => {
    setBusqueda({ ...busqueda, [e.target.name]: e.target.value });
  };

  const handleFiltro = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setBusqueda({ origen: '', destino: '', fecha: '' });
    setFiltros({ horaSalida: '', tipoBus: '' });
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    // Aquí irá la llamada al backend cuando esté listo
    console.log('Buscando viajes:', busqueda, filtros);
    alert(`Buscando: ${busqueda.origen} → ${busqueda.destino}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero con imagen de fondo */}
      <section className="relative min-h-[520px] flex items-end pb-0">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <img
            src={busCootranar}
            alt="Bus Cootranar"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.6)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/60 to-brand-blue/80"></div>
        </div>

        {/* Texto del hero */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <span className="inline-block bg-brand-blue-light text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Viaje Seguro
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
            Tu seguridad es nuestra
            <br />prioridad
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mb-8">
            Viaja tranquilo con rastreo GPS y conductores certificados.
          </p>

          {/* Buscador */}
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6">
            <form onSubmit={handleBuscar}>
              {/* Campos principales */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Origen */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    <span className="material-symbols-outlined text-brand-blue text-sm align-middle mr-1">trip_origin</span>
                    Origen
                  </label>
                  <input
                    type="text"
                    name="origen"
                    value={busqueda.origen}
                    onChange={handleBusqueda}
                    placeholder="¿Desde dónde sales?"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>

                {/* Destino */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    <span className="material-symbols-outlined text-brand-blue text-sm align-middle mr-1">location_on</span>
                    Destino
                  </label>
                  <input
                    type="text"
                    name="destino"
                    value={busqueda.destino}
                    onChange={handleBusqueda}
                    placeholder="¿A dónde vas?"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>

                {/* Fecha */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                    <span className="material-symbols-outlined text-brand-blue text-sm align-middle mr-1">calendar_month</span>
                    Fecha de salida
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={busqueda.fecha}
                    onChange={handleBusqueda}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>

                {/* Botones */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="flex items-center gap-1 border border-slate-200 text-slate-500 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-base">filter_alt_off</span>
                    Limpiar filtros
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-light text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-md shadow-brand-blue/20"
                  >
                    <span className="material-symbols-outlined text-base">search</span>
                    Buscar viajes
                  </button>
                </div>
              </div>

              {/* Toggle filtros avanzados */}
              <button
                type="button"
                onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-blue transition-colors mb-2"
              >
                <span className="material-symbols-outlined text-sm">
                  {filtrosAbiertos ? 'expand_less' : 'expand_more'}
                </span>
                Filtros Avanzados
              </button>

              {/* Filtros avanzados */}
              {filtrosAbiertos && (
                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hora de salida */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Hora de salida</p>
                    <div className="flex gap-2">
                      {['Mañana', 'Tarde', 'Noche'].map((hora) => (
                        <button
                          key={hora}
                          type="button"
                          onClick={() => setFiltros({ ...filtros, horaSalida: hora })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                            filtros.horaSalida === hora
                              ? 'bg-brand-blue text-white border-brand-blue'
                              : 'border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue'
                          }`}
                        >
                          {hora}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipo de bus */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Tipo de bus</p>
                    <div className="flex gap-2">
                      {['Premium', 'Estándar'].map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setFiltros({ ...filtros, tipoBus: tipo })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                            filtros.tipoBus === tipo
                              ? 'bg-brand-blue text-white border-brand-blue'
                              : 'border-slate-200 text-slate-500 hover:border-brand-blue hover:text-brand-blue'
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Sección: Viajes de hoy */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6">Viajes de hoy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {viajesHoy.map((viaje) => (
              <TarjetaViaje key={viaje.id} viaje={viaje} />
            ))}
          </div>
        </section>

        {/* Sección: Viajes programados */}
        <section>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6">Viajes programados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {viajesProgramados.map((viaje) => (
              <TarjetaViaje key={viaje.id} viaje={viaje} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
