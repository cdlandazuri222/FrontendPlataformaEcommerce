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
  { label: 'Frágil', icon: 'emergency_home' },
  { label: 'Otro', icon: 'category' },
];

const TARIFA_BASE = 8000;
const TARIFA_KG = 1500;
const TARIFA_DOMICILIO = 3000;

// ── Modal Resumen ──────────────────────────────────────────────────────────────
function ResumenModal({
  datos, costo, onClose, onConfirmar,
}: {
  datos: { ruta: string; remitente: string; destinatario: string; entrega: string; descripcion: string; categoria: string; peso: number | '' };
  costo: number;
  onClose: () => void;
  onConfirmar: () => void;
}) {
  const filas = [
    { label: 'RUTA', value: datos.ruta || '—' },
    { label: 'REMITENTE', value: datos.remitente || '—' },
    { label: 'DESTINATARIO', value: datos.destinatario || '—' },
    { label: 'MODALIDAD', value: datos.entrega, badge: true },
    { label: 'CONTENIDO', value: datos.descripcion ? `${datos.descripcion}${datos.categoria ? ` (${datos.categoria})` : ''}` : datos.categoria || '—' },
    { label: 'PESO', value: datos.peso !== '' ? `${datos.peso} KG` : '—' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-slate-800">Resumen de Cotización</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-xl">close</span>
          </button>
        </div>
        <div className="space-y-3 mb-5">
          {filas.map((fila) => (
            <div key={fila.label} className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{fila.label}</span>
              {fila.badge ? (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${fila.value === 'Domicilio' ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-[#0e3a8c]'}`}>
                  {fila.value}
                </span>
              ) : (
                <span className="text-sm font-bold text-slate-700">{fila.value}</span>
              )}
            </div>
          ))}
        </div>
        <div className="bg-[#eef1fb] rounded-xl py-4 px-5 text-center mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total estimado</p>
          <p className="text-4xl font-extrabold text-[#0e3a8c]">
            ${costo.toLocaleString('es-CO')}
            <span className="text-base font-semibold text-slate-400 ml-2">COP</span>
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-5">
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">IMPORTANTE:</span> Este valor es solo una referencia. El peso y las dimensiones finales serán verificados físicamente en el mostrador.
          </p>
        </div>
        <button onClick={onConfirmar} className="w-full bg-[#0e3a8c] text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition-colors tracking-wide text-sm mb-2">
          CONFIRMAR Y GUARDAR
        </button>
        <button onClick={onClose} className="w-full border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors tracking-wide text-sm">
          EDITAR DATOS
        </button>
      </div>
    </div>
  );
}

// ── Pantalla Confirmación ──────────────────────────────────────────────────────
function ConfirmacionScreen({
  codigoRef, ruta, entrega, costo, onVolver,
}: {
  codigoRef: string; ruta: string; entrega: string; costo: number; onVolver: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start py-12 px-4 bg-[#f0f2f8] relative">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg p-8">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-2">¡Cotización Generada!</h2>
        <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
          Tu solicitud de envío ha sido procesada con éxito. Por favor, conserva el siguiente código para tu gestión.
        </p>
        <div className="bg-[#f6f7fb] rounded-xl py-4 px-5 text-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Código de referencia</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-extrabold text-[#0e3a8c]">{codigoRef}</span>
            <button
              onClick={() => navigator.clipboard.writeText(codigoRef)}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400"
              title="Copiar código"
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </button>
          </div>
        </div>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#0e3a8c] text-base">receipt_long</span>
            <span className="text-xs font-extrabold text-[#0e3a8c] uppercase tracking-widest">Detalle de la cotización</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Ruta de envío</span>
              <span className="font-semibold text-slate-700">{ruta || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Modalidad de entrega</span>
              <span className="font-semibold text-slate-700">{entrega}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-400">Total estimado</span>
              <span className="text-lg font-extrabold text-[#0e3a8c]">${costo.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-6">
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Importante:</span> Presenta este código en las oficinas físicas para verificar el peso real y finalizar el servicio. El valor final puede variar según las dimensiones.
          </p>
        </div>
        <button className="w-full bg-[#0e3a8c] text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 mb-3">
          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
          Descargar Cotización (PDF)
        </button>
        <button onClick={onVolver} className="w-full text-slate-500 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
          Volver al Inicio
        </button>
      </div>
      <div className="mt-6 text-center text-xs text-slate-400">
        ¿Necesitas ayuda?{' '}
        <a href="#" className="text-[#0e3a8c] font-semibold hover:underline">Contactar soporte</a>
        {' · '}
        <a href="#" className="text-[#0e3a8c] font-semibold hover:underline">Preguntas frecuentes</a>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export function CotizarEncomiendaPage() {
  const [remitente, setRemitente] = useState({ nombre: '', cedula: '', telefono: '' });
  const [destinatario, setDestinatario] = useState({ nombre: '', cedula: '', telefono: '' });
  const [ruta, setRuta] = useState('');
  const [entrega, setEntrega] = useState<'Oficina' | 'Domicilio'>('Oficina');
  const [direccion, setDireccion] = useState('');
  const [peso, setPeso] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [codigoRef] = useState(`ENC-${Math.floor(10000 + Math.random() * 90000)}`);

  const calcularCosto = () => {
    const pesoNum = typeof peso === 'number' ? peso : 0;
    const base = TARIFA_BASE + pesoNum * TARIFA_KG;
    return entrega === 'Domicilio' ? base + TARIFA_DOMICILIO : base;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalAbierto(true);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
      <Navbar />

      {confirmado ? (
        <ConfirmacionScreen
          codigoRef={codigoRef}
          ruta={ruta}
          entrega={entrega}
          costo={calcularCosto()}
          onVolver={() => setConfirmado(false)}
        />
      ) : (
        <>
          {modalAbierto && (
            <ResumenModal
              datos={{ ruta, remitente: remitente.nombre, destinatario: destinatario.nombre, entrega, descripcion, categoria, peso }}
              costo={calcularCosto()}
              onClose={() => setModalAbierto(false)}
              onConfirmar={() => { setModalAbierto(false); setConfirmado(true); }}
            />
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Left: form */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 lg:max-w-[55%]">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
                Servicios / <span className="text-[#0e3a8c]">Encomiendas</span>
              </p>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-1">Cotizar Encomienda</h2>
              <p className="text-sm text-slate-400 mb-7">Calcula el costo de tu envío de forma rápida y segura.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Remitente y Destinatario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#0e3a8c]/10 p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-[#0e3a8c] text-base">person</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#0e3a8c] uppercase tracking-widest">Remitente</span>
                    </div>
                    <input type="text" placeholder="Nombre Completo" value={remitente.nombre}
                      onChange={(e) => setRemitente({ ...remitente, nombre: e.target.value })}
                      className="w-full bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Cédula / NIT" value={remitente.cedula}
                        onChange={(e) => setRemitente({ ...remitente, cedula: e.target.value })}
                        className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                      <input type="tel" placeholder="300..." value={remitente.telefono}
                        onChange={(e) => setRemitente({ ...remitente, telefono: e.target.value })}
                        className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#0e3a8c]/10 p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-[#0e3a8c] text-base">location_on</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#0e3a8c] uppercase tracking-widest">Destinatario</span>
                    </div>
                    <input type="text" placeholder="Quien recibe" value={destinatario.nombre}
                      onChange={(e) => setDestinatario({ ...destinatario, nombre: e.target.value })}
                      className="w-full bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Cédula / NIT" value={destinatario.cedula}
                        onChange={(e) => setDestinatario({ ...destinatario, cedula: e.target.value })}
                        className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                      <input type="tel" placeholder="300..." value={destinatario.telefono}
                        onChange={(e) => setDestinatario({ ...destinatario, telefono: e.target.value })}
                        className="bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
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
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ruta de envío</p>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">route</span>
                        <select value={ruta} onChange={(e) => setRuta(e.target.value)}
                          className="w-full bg-[#f6f6f8] rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] appearance-none text-slate-600">
                          <option value="">Seleccionar Origen - Dest.</option>
                          {RUTAS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Modalidad de entrega</p>
                      <div className="flex gap-2">
                        {(['Oficina', 'Domicilio'] as const).map((op) => (
                          <button key={op} type="button" onClick={() => setEntrega(op)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${entrega === op ? 'bg-[#0e3a8c] text-white border-[#0e3a8c]' : 'bg-[#f6f6f8] text-slate-500 border-slate-200 hover:border-[#0e3a8c]'}`}>
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {entrega === 'Domicilio' && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dirección del destinatario</p>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">home_pin</span>
                        <input type="text" placeholder="Dirección completa, Barrio, Ciudad" value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                          className="w-full bg-[#f6f6f8] rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                      </div>
                    </div>
                  )}
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
                        <input type="number" min={0} placeholder="0" value={peso}
                          onChange={(e) => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-[#f6f6f8] rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción del artículo</p>
                        <span className="text-xs text-[#0e3a8c] font-semibold cursor-pointer hover:underline">Ver contenidos</span>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">edit_note</span>
                        <input type="text" placeholder="Ej. Celular, Ropa, etc." value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          className="w-full bg-[#f6f6f8] rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] placeholder:text-slate-300" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categoría / Contenido</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIAS.map((cat) => (
                        <button key={cat.label} type="button" onClick={() => setCategoria(cat.label)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${categoria === cat.label ? 'bg-[#0e3a8c] text-white border-[#0e3a8c]' : 'bg-[#f6f6f8] text-slate-500 border-slate-200 hover:border-[#0e3a8c]'}`}>
                          <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Aviso */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-bold">IMPORTANTE:</span> El precio final puede variar sujeto a verificación de peso y dimensiones en almacenamiento. Este valor es una estimación.
                  </p>
                </div>

                {/* Precio y botón */}
                <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center justify-between gap-4">
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
                  <button type="submit"
                    className="bg-[#0e3a8c] text-white font-bold px-7 py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 whitespace-nowrap">
                    Generar Cotización
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: image */}
            <div className="hidden lg:block lg:w-[45%] relative">
              <img src={busCootranar} alt="Bus Cootranar" className="absolute inset-0 w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-b from-sky-400/40 via-transparent to-black/75" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-4 tracking-wide">
                  SERVICIO EXPRESS
                </span>
                <h3 className="text-white text-3xl font-extrabold leading-tight drop-shadow">
                  Tu encomienda en<br />manos expertas
                </h3>
                <p className="text-white/75 text-sm mt-2 leading-relaxed">
                  Llegamos a cada rincón con la seguridad y<br />confianza que necesitas.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
