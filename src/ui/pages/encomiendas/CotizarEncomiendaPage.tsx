import { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import busCootranar from '../../../assets/busCootranar.png';

const RUTAS = [
  'Pasto → Cali',
  'Pasto → Bogotá',
  'Pasto → Ipiales',
  'Ipiales → Popayán',
  'Cali → Pasto',
];

const CATEGORIAS = [
  { label: 'Tecnología', icon: 'devices' },
  { label: 'Ropa', icon: 'checkroom' },
  { label: 'Documentos', icon: 'description' },
  { label: 'Frágil', icon: 'fragile' },
  { label: 'Otro', icon: 'category' },
];

const TARIFA_BASE = 8000;
const TARIFA_KG = 1500;
const TARIFA_DOMICILIO = 3000;

export function CotizarEncomiendaPage() {
  const [remitente, setRemitente] = useState({ nombre: '', cedula: '', telefono: '' });
  const [destinatario, setDestinatario] = useState({ nombre: '', cedula: '', telefono: '' });
  const [ruta, setRuta] = useState('');
  const [entrega, setEntrega] = useState<'Oficina' | 'Domicilio'>('Oficina');
  const [peso, setPeso] = useState<number | ''>('');
  const [valor, setValor] = useState<number | ''>('');
  const [categoria, setCategoria] = useState('');

  const calcularCosto = () => {
    const pesoNum = typeof peso === 'number' ? peso : 0;
    const base = TARIFA_BASE + pesoNum * TARIFA_KG;
    return entrega === 'Domicilio' ? base + TARIFA_DOMICILIO : base;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Cotización generada:', { remitente, destinatario, ruta, entrega, peso, valor, categoria });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-32 md:pb-12">
        {/* Breadcrumb */}
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
          Servicios / <span className="text-[#0e3a8c]">Encomiendas</span>
        </p>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-1">Cotizar Encomienda</h2>
        <p className="text-sm text-slate-400 mb-8">Calcula el costo de tu envío de forma rápida y segura.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">

            {/* Remitente y Destinatario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Remitente */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-[#0e3a8c]/10 p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[#0e3a8c] text-base">person</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#0e3a8c] uppercase tracking-widest">Remitente</span>
                </div>
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  value={remitente.nombre}
                  onChange={(e) => setRemitente({ ...remitente, nombre: e.target.value })}
                  className="w-full bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Cédula / NIT"
                    value={remitente.cedula}
                    onChange={(e) => setRemitente({ ...remitente, cedula: e.target.value })}
                    className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                  />
                  <input
                    type="tel"
                    placeholder="300..."
                    value={remitente.telefono}
                    onChange={(e) => setRemitente({ ...remitente, telefono: e.target.value })}
                    className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Destinatario */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-[#0e3a8c]/10 p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[#0e3a8c] text-base">location_on</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#0e3a8c] uppercase tracking-widest">Destinatario</span>
                </div>
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  value={destinatario.nombre}
                  onChange={(e) => setDestinatario({ ...destinatario, nombre: e.target.value })}
                  className="w-full bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Cédula / NIT"
                    value={destinatario.cedula}
                    onChange={(e) => setDestinatario({ ...destinatario, cedula: e.target.value })}
                    className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                  />
                  <input
                    type="tel"
                    placeholder="300..."
                    value={destinatario.telefono}
                    onChange={(e) => setDestinatario({ ...destinatario, telefono: e.target.value })}
                    className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Información de Envío */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-[#0e3a8c]/10 p-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[#0e3a8c] text-base">local_shipping</span>
                </div>
                <span className="text-sm font-extrabold text-slate-700">Información de Envío</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ruta de origen</p>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">route</span>
                    <select
                      value={ruta}
                      onChange={(e) => setRuta(e.target.value)}
                      className="w-full bg-[#f6f6f8] rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] appearance-none text-slate-600"
                    >
                      <option value="">Seleccionar Origen - Dest.</option>
                      {RUTAS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Modalidad de entrega</p>
                  <div className="flex gap-2">
                    {(['Oficina', 'Domicilio'] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setEntrega(op)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                          entrega === op
                            ? 'bg-[#0e3a8c] text-white border-[#0e3a8c]'
                            : 'bg-[#f6f6f8] text-slate-500 border-transparent hover:border-[#0e3a8c]'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles del Paquete */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-[#0e3a8c]/10 p-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[#0e3a8c] text-base">inventory_2</span>
                </div>
                <span className="text-sm font-extrabold text-slate-700">Detalles del Paquete</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Peso estimado (kg)</p>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Valor declarado</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={valor}
                      onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#f6f6f8] rounded-lg pl-6 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Naturaleza / Contenido</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setCategoria(cat.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                        categoria === cat.label
                          ? 'bg-[#0e3a8c] text-white border-[#0e3a8c]'
                          : 'bg-[#f6f6f8] text-slate-500 border-transparent hover:border-[#0e3a8c]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Panel lateral - imagen + info */}
          <div className="lg:col-span-2 hidden lg:flex flex-col gap-5">
            <div className="relative rounded-2xl overflow-hidden h-full min-h-[400px] bg-slate-800">
              <img
                src={busCootranar}
                alt="Bus Cootranar"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="bg-[#0e3a8c] text-white text-xs font-bold px-3 py-1.5 rounded-full inline-block mb-3">
                  Servicio Express
                </span>
                <h3 className="text-white text-2xl font-extrabold leading-tight">
                  Tu encomienda en<br />manos expertas
                </h3>
                <p className="text-white/70 text-sm mt-2">
                  Llegamos a cada rincón con seguridad y confianza que necesitas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer fijo con precio y botón */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-5px_20px_rgba(0,0,0,0.06)] z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#0e3a8c]/10 p-2 rounded-xl">
              <span className="material-symbols-outlined text-[#0e3a8c]">receipt_long</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Precio estimado</p>
              <p className="text-2xl font-extrabold text-slate-800">
                ${calcularCosto().toLocaleString('es-CO')}
                <span className="text-xs font-normal text-slate-400 ml-1">COP</span>
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="submit"
              form=""
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-[#0e3a8c] text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              Generar Cotización
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-300 pb-2 px-4">
          * El costo final puede variar según el peso real, dimensiones y modalidad de entrega seleccionada.
        </p>
      </div>
    </div>
  );
}
