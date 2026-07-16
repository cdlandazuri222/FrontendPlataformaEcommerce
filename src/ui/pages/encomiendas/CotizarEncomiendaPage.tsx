import { useEffect, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import busCootranar from '../../../assets/busCootranar.png';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useAuth } from '../../hooks/useAuth';
import { usePreinscripcionEncomienda } from '../../hooks/usePreinscripcionEncomienda';
import type { OficinaEncomiendaAPI, PreinscripcionResultadoAPI } from '../../../infrastructure/api/encomiendasApi';

const CATEGORIAS = [
  { label: 'Tecnología', icon: 'devices' },
  { label: 'Ropa', icon: 'checkroom' },
  { label: 'Documentos', icon: 'description' },
  { label: 'Frágil', icon: 'emergency_home' },
  { label: 'Otro', icon: 'category' },
];

interface DatosFormulario {
  idOficinaOrigen: number | '';
  idOficinaDestino: number | '';
  destinatarioNombre: string;
  destinatarioDocumento: string;
  destinatarioTelefono: string;
  entrega: 'Oficina' | 'Domicilio';
  direccion: string;
  pesoEstimado: number | '';
  volumenEstimado: number | '';
  valorDeclarado: number | '';
  descripcion: string;
  categoria: string;
}

// ── Modal Resumen ──────────────────────────────────────────────────────────────
function ResumenModal({
  datos, oficinas, costo, loadingCotizacion, errorCotizacion, loadingEnvio, errorEnvio, onClose, onConfirmar,
}: {
  datos: DatosFormulario;
  oficinas: OficinaEncomiendaAPI[];
  costo: number | null;
  loadingCotizacion: boolean;
  errorCotizacion: string;
  loadingEnvio: boolean;
  errorEnvio: string;
  onClose: () => void;
  onConfirmar: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const e = tx.encomiendas;

  const nombreOficina = (id: number | '') => oficinas.find((o) => o.idoficinaencomienda === id)?.nombreciudad ?? '—';

  const filas = [
    { label: e.oficinaOrigen, value: nombreOficina(datos.idOficinaOrigen) },
    { label: e.oficinaDestino, value: nombreOficina(datos.idOficinaDestino) },
    { label: e.destinatario, value: datos.destinatarioNombre || '—' },
    { label: e.documentoDestinatario, value: datos.destinatarioDocumento || '—' },
    { label: e.modalidad, value: datos.entrega === 'Oficina' ? (idioma === 'es' ? 'Oficina' : 'Office') : (idioma === 'es' ? 'Domicilio' : 'Home Delivery'), badge: true },
    { label: idioma === 'es' ? 'CONTENIDO' : 'CONTENT', value: datos.descripcion ? `${datos.descripcion}${datos.categoria ? ` (${datos.categoria})` : ''}` : datos.categoria || '—' },
    { label: e.peso, value: datos.pesoEstimado !== '' ? `${datos.pesoEstimado} KG` : '—' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{e.resumen}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl">close</span>
          </button>
        </div>
        <div className="space-y-3 mb-5">
          {filas.map((fila) => (
            <div key={fila.label} className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{fila.label}</span>
              {fila.badge ? (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${fila.value === 'Domicilio' || fila.value === 'Home Delivery' ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' : 'bg-blue-100 dark:bg-blue-955/40 text-[#0e3a8c] dark:text-blue-400'}`}>
                  {fila.value}
                </span>
              ) : (
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{fila.value}</span>
              )}
            </div>
          ))}
        </div>
        <div className="bg-[#eef1fb] dark:bg-slate-900/60 rounded-xl py-4 px-5 text-center mb-4 transition-colors">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{e.totalEstimado}</p>
          {loadingCotizacion ? (
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">{e.calculando}</p>
          ) : errorCotizacion ? (
            <p className="text-sm font-semibold text-red-500">{errorCotizacion}</p>
          ) : (
            <p className="text-4xl font-extrabold text-[#0e3a8c] dark:text-blue-400">
              ${(costo ?? 0).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}
              <span className="text-base font-semibold text-slate-400 dark:text-slate-500 ml-2">COP</span>
            </p>
          )}
        </div>
        <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3 flex items-start gap-2 mb-5">
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <span className="font-bold">IMPORTANTE. </span> {idioma === 'es' ? 'Este valor es solo una referencia. El peso y las dimensiones finales serán verificados físicamente en la oficina de Encomiendas seleccionada como origen.' : 'This value is only a reference. The final weight and dimensions will be physically verified at the counter.'}
          </p>
        </div>
        {errorEnvio && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
            <span className="material-symbols-outlined text-red-500 text-base mt-0.5">error</span>
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{errorEnvio}</p>
          </div>
        )}
        <button onClick={onConfirmar} disabled={loadingEnvio || loadingCotizacion || costo === null}
          className="w-full bg-[#0e3a8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition-colors tracking-wide text-sm mb-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loadingEnvio && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
          {loadingEnvio ? e.enviando : e.confirmarGuardar}
        </button>
        <button onClick={onClose} disabled={loadingEnvio} className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors tracking-wide text-sm disabled:opacity-50">
          {e.editarDatos}
        </button>
      </div>
    </div>
  );
}

// ── Pantalla Confirmación ──────────────────────────────────────────────────────
function ConfirmacionScreen({
  resultado, onVolver,
}: {
  resultado: PreinscripcionResultadoAPI; onVolver: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const e = tx.encomiendas;
  const qrSrc = resultado.qrBase64.startsWith('data:')
    ? resultado.qrBase64
    : `data:image/png;base64,${resultado.qrBase64}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-12 px-4 bg-[#f0f2f8] dark:bg-slate-900 relative transition-colors">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm w-full max-w-lg p-8 transition-colors">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 text-center mb-2">{e.generada}</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center mb-6 leading-relaxed">
          {idioma === 'es' ? 'Tu solicitud de envío ha sido procesada con éxito. Por favor, conserva el siguiente código para tu gestión.' : 'Your shipment request has been successfully processed. Please keep the following code for your records.'}
        </p>
        <div className="bg-[#f6f7fb] dark:bg-slate-900/60 rounded-xl py-4 px-5 text-center mb-6">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.codigoRef}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-extrabold text-[#0e3a8c] dark:text-blue-400">{resultado.referencia}</span>
            <button
              onClick={() => navigator.clipboard.writeText(resultado.referencia)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 dark:text-slate-500"
              title={idioma === 'es' ? 'Copiar código' : 'Copy code'}
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <img src={qrSrc} alt="QR" className="w-40 h-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
          </div>
        </div>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base">receipt_long</span>
            <span className="text-xs font-extrabold text-[#0e3a8c] dark:text-blue-400 uppercase tracking-widest">{e.detalle}</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-400 dark:text-slate-500">{e.totalEstimado}</span>
              <span className="text-lg font-extrabold text-[#0e3a8c] dark:text-blue-400">${resultado.cotizacion.toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} COP</span>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3 flex items-start gap-2 mb-6">
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <span className="font-bold">Importante / Important:</span> {e.instruccionesOficina}
          </p>
        </div>
        <button onClick={onVolver} className="w-full text-slate-500 dark:text-slate-400 font-semibold py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
          {e.volverInicio}
        </button>
      </div>
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        {idioma === 'es' ? '¿Necesitas ayuda?' : 'Need help?'}{' '}
        <a href="#" className="text-[#0e3a8c] dark:text-blue-400 font-semibold hover:underline">{idioma === 'es' ? 'Contactar soporte' : 'Contact support'}</a>
        {' · '}
        <a href="#" className="text-[#0e3a8c] dark:text-blue-400 font-semibold hover:underline">{idioma === 'es' ? 'Preguntas frecuentes' : 'FAQs'}</a>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export function CotizarEncomiendaPage() {
  const { tx, idioma } = usePreferencias();
  const e = tx.encomiendas;
  const { getUsuario } = useAuth();
  const usuario = getUsuario();

  const {
    oficinas, loadingOficinas, errorOficinas, cargarOficinas,
    cotizacion, loadingCotizacion, errorCotizacion, cotizarConDebounce, limpiarCotizacion,
    loadingEnvio, errorEnvio, resultado, enviarPreinscripcion, reiniciar,
  } = usePreinscripcionEncomienda();

  const [idOficinaOrigen, setIdOficinaOrigen] = useState<number | ''>('');
  const [idOficinaDestino, setIdOficinaDestino] = useState<number | ''>('');
  const [destinatarioNombre, setDestinatarioNombre] = useState('');
  const [destinatarioDocumento, setDestinatarioDocumento] = useState('');
  const [destinatarioTelefono, setDestinatarioTelefono] = useState('');
  const [entrega, setEntrega] = useState<'Oficina' | 'Domicilio'>('Oficina');
  const [direccion, setDireccion] = useState('');
  const [pesoEstimado, setPesoEstimado] = useState<number | ''>('');
  const [volumenEstimado, setVolumenEstimado] = useState<number | ''>('');
  const [valorDeclarado, setValorDeclarado] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [validacionMsg, setValidacionMsg] = useState('');

  useEffect(() => {
    cargarOficinas();
  }, [cargarOficinas]);

  // Dispara la cotización (con debounce) cuando cambian los campos relevantes
  useEffect(() => {
    if (idOficinaOrigen === '' || idOficinaDestino === '' || pesoEstimado === '' || idOficinaOrigen === idOficinaDestino) {
      limpiarCotizacion();
      return;
    }
    cotizarConDebounce({
      idOficinaOrigen: Number(idOficinaOrigen),
      idOficinaDestino: Number(idOficinaDestino),
      pesoEstimado: Number(pesoEstimado),
      volumenEstimado: volumenEstimado === '' ? undefined : Number(volumenEstimado),
      valorDeclarado: valorDeclarado === '' ? undefined : Number(valorDeclarado),
      esDomicilio: entrega === 'Domicilio',
      valorDomicilio: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOficinaOrigen, idOficinaDestino, pesoEstimado, volumenEstimado, valorDeclarado, entrega]);

  const camposCompletos = () => (
    idOficinaOrigen !== '' && idOficinaDestino !== '' &&
    destinatarioNombre.trim() !== '' && destinatarioDocumento.trim() !== '' && destinatarioTelefono.trim() !== '' &&
    pesoEstimado !== '' && descripcion.trim() !== ''
  );

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setValidacionMsg('');

    if (idOficinaOrigen !== '' && idOficinaDestino !== '' && idOficinaOrigen === idOficinaDestino) {
      setValidacionMsg(e.oficinasIguales);
      return;
    }
    if (!camposCompletos()) {
      setValidacionMsg(e.camposObligatorios);
      return;
    }
    setModalAbierto(true);
  };

  const handleConfirmar = async () => {
    try {
      await enviarPreinscripcion({
        idOficinaOrigen: Number(idOficinaOrigen),
        idOficinaDestino: Number(idOficinaDestino),
        nombreDestinatario: destinatarioNombre,
        documentoDestinatario: destinatarioDocumento,
        telefonoDestinatario: destinatarioTelefono,
        contenidoDeclarado: categoria ? `${descripcion} (${categoria})` : descripcion,
        pesoEstimado: Number(pesoEstimado),
        volumenEstimado: volumenEstimado === '' ? undefined : Number(volumenEstimado),
        valorDeclarado: valorDeclarado === '' ? undefined : Number(valorDeclarado),
        direccionDestinatario: entrega === 'Domicilio' ? direccion : undefined,
        esDomicilio: entrega === 'Domicilio',
        valorDomicilio: 0,
      });
      setModalAbierto(false);
    } catch {
      // el error queda expuesto vía errorEnvio, el modal permanece abierto
    }
  };

  const handleVolver = () => {
    reiniciar();
    setModalAbierto(false);
    setIdOficinaOrigen('');
    setIdOficinaDestino('');
    setDestinatarioNombre('');
    setDestinatarioDocumento('');
    setDestinatarioTelefono('');
    setDireccion('');
    setPesoEstimado('');
    setVolumenEstimado('');
    setValorDeclarado('');
    setDescripcion('');
    setCategoria('');
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 flex flex-col transition-colors duration-200">
      <Navbar />

      {resultado ? (
        <ConfirmacionScreen resultado={resultado} onVolver={handleVolver} />
      ) : (
        <>
          {modalAbierto && (
            <ResumenModal
              datos={{
                idOficinaOrigen, idOficinaDestino, destinatarioNombre, destinatarioDocumento, destinatarioTelefono,
                entrega, direccion, pesoEstimado, volumenEstimado, valorDeclarado, descripcion, categoria,
              }}
              oficinas={oficinas}
              costo={cotizacion}
              loadingCotizacion={loadingCotizacion}
              errorCotizacion={errorCotizacion}
              loadingEnvio={loadingEnvio}
              errorEnvio={errorEnvio}
              onClose={() => setModalAbierto(false)}
              onConfirmar={handleConfirmar}
            />
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Left: form */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 pb-28 lg:max-w-[55%]">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mb-2">
                {idioma === 'es' ? 'Servicios' : 'Services'} / <span className="text-[#0e3a8c] dark:text-blue-400">{e.titulo}</span>
              </p>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">{e.titulo}</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-7">
                {idioma === 'es'
                  ? 'Calcula el costo de tu envío de forma rápida y segura.'
                  : 'Calculate the shipping cost of your parcel quickly and safely.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Remitente y Destinatario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-3 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#0e3a8c]/10 dark:bg-blue-400/10 p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base">person</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#0e3a8c] dark:text-blue-400 uppercase tracking-widest">{e.remitente}</span>
                    </div>
                    <input type="text" readOnly value={usuario ? `${usuario.nombre} ${usuario.apellido}` : ''}
                      className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none cursor-not-allowed opacity-80" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" readOnly value={usuario?.documento ?? ''}
                        className="bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none cursor-not-allowed opacity-80" />
                      <input type="tel" readOnly value={usuario?.telefono ?? ''}
                        className="bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none cursor-not-allowed opacity-80" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-3 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-[#0e3a8c]/10 dark:bg-blue-400/10 p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base">location_on</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#0e3a8c] dark:text-blue-400 uppercase tracking-widest">{e.destinatario}</span>
                    </div>
                    <input type="text" placeholder={e.quienRecibe} value={destinatarioNombre}
                      onChange={(ev) => setDestinatarioNombre(ev.target.value)} required
                      className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-500" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder={e.documentoDestinatario} value={destinatarioDocumento}
                        onChange={(ev) => setDestinatarioDocumento(ev.target.value)} required
                        className="bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-555" />
                      <input type="tel" placeholder={idioma === 'es' ? 'Teléfono' : 'Phone'} value={destinatarioTelefono}
                        onChange={(ev) => setDestinatarioTelefono(ev.target.value)} required
                        className="bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-355 dark:placeholder:text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Información de Envío */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0e3a8c]/10 dark:bg-blue-400/10 p-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base">local_shipping</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{e.infoEnvio}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.oficinaOrigen}</p>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base">route</span>
                        <select value={idOficinaOrigen} required disabled={loadingOficinas}
                          onChange={(ev) => setIdOficinaOrigen(ev.target.value === '' ? '' : Number(ev.target.value))}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 appearance-none text-slate-650 dark:text-slate-200 border-none disabled:opacity-60">
                          <option value="" className="dark:bg-slate-800">{loadingOficinas ? e.cargandoOficinas : e.seleccionarOficina}</option>
                          {oficinas.map((o) => (
                            <option key={o.idoficinaencomienda} value={o.idoficinaencomienda} className="dark:bg-slate-800">
                              {o.nombreciudad} - {o.direccion}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.oficinaDestino}</p>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base">route</span>
                        <select value={idOficinaDestino} required disabled={loadingOficinas}
                          onChange={(ev) => setIdOficinaDestino(ev.target.value === '' ? '' : Number(ev.target.value))}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 appearance-none text-slate-650 dark:text-slate-200 border-none disabled:opacity-60">
                          <option value="" className="dark:bg-slate-800">{loadingOficinas ? e.cargandoOficinas : e.seleccionarOficina}</option>
                          {oficinas.map((o) => (
                            <option key={o.idoficinaencomienda} value={o.idoficinaencomienda} className="dark:bg-slate-800">
                              {o.nombreciudad} - {o.direccion}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {errorOficinas && (
                    <p className="text-xs text-red-500 font-semibold">{errorOficinas}</p>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.modalidad}</p>
                    <div className="flex gap-2">
                      {(['Oficina', 'Domicilio'] as const).map((op) => (
                        <button key={op} type="button" onClick={() => setEntrega(op)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${entrega === op ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white border-[#0e3a8c] dark:border-blue-600' : 'bg-[#f6f6f8] dark:bg-slate-750 text-slate-550 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#0e3a8c] dark:hover:border-blue-400'}`}>
                          {op === 'Oficina' ? (idioma === 'es' ? 'Oficina' : 'Office') : (idioma === 'es' ? 'Domicilio' : 'Home')}
                        </button>
                      ))}
                    </div>
                  </div>
                  {entrega === 'Domicilio' && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{idioma === 'es' ? 'Dirección del destinatario' : 'Recipient address'}</p>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base">home_pin</span>
                        <input type="text" placeholder={idioma === 'es' ? 'Dirección completa, Barrio, Ciudad' : 'Full address, Neighborhood, City'} value={direccion}
                          onChange={(ev) => setDireccion(ev.target.value)}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Detalles del Paquete */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0e3a8c]/10 dark:bg-blue-400/10 p-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base">inventory_2</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{e.detallesPaquete}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.peso}</p>
                      <div className="relative">
                        <input type="number" min={0.01} step={0.01} placeholder="0" value={pesoEstimado} required
                          onChange={(ev) => setPesoEstimado(ev.target.value === '' ? '' : Number(ev.target.value))}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-500" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">kg</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.volumenEstimado}</p>
                      <div className="relative">
                        <input type="number" min={0} step={0.01} placeholder="0" value={volumenEstimado}
                          onChange={(ev) => setVolumenEstimado(ev.target.value === '' ? '' : Number(ev.target.value))}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-500" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">m³</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.valorDeclarado}</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">$</span>
                        <input type="number" min={0} step={100} placeholder="0" value={valorDeclarado}
                          onChange={(ev) => setValorDeclarado(ev.target.value === '' ? '' : Number(ev.target.value))}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{e.descripcion}</p>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base">edit_note</span>
                        <input type="text" placeholder={idioma === 'es' ? 'Ej. Celular, Ropa, etc.' : 'e.g. Cellphone, Clothes, etc.'} value={descripcion} required
                          onChange={(ev) => setDescripcion(ev.target.value)}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 placeholder:text-slate-350 dark:placeholder:text-slate-500" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{e.categoria}</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIAS.map((cat) => {
                        const translatedLabel = cat.label === 'Tecnología' ? (idioma === 'es' ? 'Tecnología' : 'Technology')
                          : cat.label === 'Ropa' ? (idioma === 'es' ? 'Ropa' : 'Clothing')
                            : cat.label === 'Documentos' ? (idioma === 'es' ? 'Documentos' : 'Documents')
                              : cat.label === 'Frágil' ? (idioma === 'es' ? 'Frágil' : 'Fragile')
                                : (idioma === 'es' ? 'Otro' : 'Other');
                        return (
                          <button key={cat.label} type="button" onClick={() => setCategoria(cat.label)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${categoria === cat.label ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white border-[#0e3a8c] dark:border-blue-600' : 'bg-[#f6f6f8] dark:bg-slate-700 text-slate-550 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#0e3a8c] dark:hover:border-blue-400'}`}>
                            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                            {translatedLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Aviso */}
                <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <span className="font-bold">IMPORTANTE / IMPORTANT:</span> {idioma === 'es' ? 'El precio final puede variar sujeto a verificación de peso y dimensiones en almacenamiento. Este valor es una estimación.' : 'The final price may vary subject to weight and dimensions verification at the warehouse. This value is an estimate.'}
                  </p>
                </div>

                {validacionMsg && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-red-500 text-base mt-0.5">error</span>
                    <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{validacionMsg}</p>
                  </div>
                )}

                {/* Precio y botón */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-5 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0e3a8c]/10 dark:bg-blue-400/10 p-2 rounded-xl">
                      <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{e.totalEstimado}</p>
                      {loadingCotizacion ? (
                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">{e.calculando}</p>
                      ) : errorCotizacion ? (
                        <p className="text-sm font-semibold text-red-500">{errorCotizacion}</p>
                      ) : (
                        <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                          ${(cotizacion ?? 0).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}
                          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">COP</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full sm:w-auto bg-[#0e3a8c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 whitespace-nowrap">
                    {e.generarBtn}
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
                  {idioma === 'es' ? 'SERVICIO EXPRESS' : 'EXPRESS SERVICE'}
                </span>
                <h3 className="text-white text-3xl font-extrabold leading-tight drop-shadow">
                  {idioma === 'es' ? <>Tu encomienda en<br />manos expertas</> : <>Your parcel in<br />expert hands</>}
                </h3>
                <p className="text-white/75 text-sm mt-2 leading-relaxed">
                  {idioma === 'es'
                    ? <>Llegamos a cada rincón con la seguridad y<br />confianza que necesitas.</>
                    : <>We reach every corner with the security and<br />confidence you need.</>}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
