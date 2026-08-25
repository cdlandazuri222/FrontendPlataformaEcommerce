import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useAuth } from '../../hooks/useAuth';
import { usePreinscripcionEncomienda } from '../../hooks/usePreinscripcionEncomienda';
import type { OficinaEncomiendaAPI, PreinscripcionResultadoAPI } from '../../../infrastructure/api/encomiendasApi';
import { ROUTES } from '../../../shared/constants';

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
  datos,
  oficinas,
  costo,
  loadingCotizacion,
  errorCotizacion,
  loadingEnvio,
  errorEnvio,
  onClose,
  onConfirmar,
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

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const nombreOficina = (id: number | '') =>
    oficinas.find((o) => o.idoficinaencomienda === id)?.nombreciudad ?? '—';

  const filas = [
    { label: e.oficinaOrigen, value: nombreOficina(datos.idOficinaOrigen) },
    { label: e.oficinaDestino, value: nombreOficina(datos.idOficinaDestino) },
    { label: e.destinatario, value: datos.destinatarioNombre || '—' },
    { label: e.documentoDestinatario, value: datos.destinatarioDocumento || '—' },
    {
      label: e.modalidad,
      value:
        datos.entrega === 'Oficina'
          ? idioma === 'es'
            ? 'Oficina'
            : 'Office'
          : idioma === 'es'
          ? 'Domicilio'
          : 'Home Delivery',
      badge: true,
    },
    {
      label: idioma === 'es' ? 'CONTENIDO' : 'CONTENT',
      value: datos.descripcion
        ? `${datos.descripcion}${datos.categoria ? ` (${datos.categoria})` : ''}`
        : datos.categoria || '—',
    },
    { label: e.peso, value: datos.pesoEstimado !== '' ? `${datos.pesoEstimado} KG` : '—' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 z-10 border border-slate-100 dark:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{e.resumen}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 dark:text-slate-500"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="space-y-3 mb-5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
          {filas.map((fila) => (
            <div key={fila.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {fila.label}
              </span>
              {fila.badge ? (
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    fila.value === 'Domicilio' || fila.value === 'Home Delivery'
                      ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                      : 'bg-blue-100 dark:bg-blue-950/50 text-[#0e3a8c] dark:text-blue-300'
                  }`}
                >
                  {fila.value}
                </span>
              ) : (
                <span className="font-bold text-slate-700 dark:text-slate-200 text-right truncate max-w-[200px]">
                  {fila.value}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#0e3a8c]/10 to-blue-500/10 dark:from-blue-950/60 dark:to-slate-900/60 rounded-2xl py-4 px-5 text-center mb-4 border border-blue-100 dark:border-blue-900/40">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            {e.totalEstimado}
          </p>
          {loadingCotizacion ? (
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              {e.calculando}
            </p>
          ) : errorCotizacion ? (
            <p className="text-sm font-semibold text-red-500">{errorCotizacion}</p>
          ) : (
            <p className="text-3xl sm:text-4xl font-black text-[#0e3a8c] dark:text-blue-400">
              ${(costo ?? 0).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1.5">COP</span>
            </p>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 mb-5">
          <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base mt-0.5 shrink-0">info</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-[#0e3a8c] dark:text-blue-400">NOTA: </span>
            {idioma === 'es'
              ? 'Este valor es referencial. El peso y volumen serán verificados en taquilla.'
              : 'This value is a reference. Final weight will be verified at the office counter.'}
          </p>
        </div>

        {errorEnvio && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl px-3.5 py-2.5 flex items-start gap-2 mb-4">
            <span className="material-symbols-outlined text-red-500 text-base mt-0.5 shrink-0">error</span>
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{errorEnvio}</p>
          </div>
        )}

        <button
          onClick={onConfirmar}
          disabled={loadingEnvio || loadingCotizacion || costo === null}
          className="w-full bg-gradient-to-r from-[#0e3a8c] to-[#1a4ea8] hover:from-[#092b6b] hover:to-[#133d85] dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-blue-900/20 tracking-wide text-sm mb-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
        >
          {loadingEnvio && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
          {loadingEnvio ? e.enviando : e.confirmarGuardar}
        </button>
        <button
          onClick={onClose}
          disabled={loadingEnvio}
          className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors tracking-wide text-sm disabled:opacity-50"
        >
          {e.editarDatos}
        </button>
      </div>
    </div>
  );
}

// ── Pantalla Confirmación ──────────────────────────────────────────────────────
function ConfirmacionScreen({
  resultado,
  onVolver,
}: {
  resultado: PreinscripcionResultadoAPI;
  onVolver: () => void;
}) {
  const { tx, idioma } = usePreferencias();
  const e = tx.encomiendas;
  const qrSrc = resultado.qrBase64.startsWith('data:')
    ? resultado.qrBase64
    : `data:image/png;base64,${resultado.qrBase64}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-12 px-4 bg-[#f6f6f8] dark:bg-slate-900 transition-colors">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl w-full max-w-lg p-6 sm:p-8 transition-colors">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="material-symbols-outlined text-3xl">check</span>
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 text-center mb-2">
          {e.generada}
        </h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center mb-6 leading-relaxed">
          {idioma === 'es'
            ? 'Tu solicitud de envío ha sido procesada con éxito. Presenta este código o QR en la oficina para despachar.'
            : 'Your shipment request has been processed successfully. Present this code or QR at the office.'}
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl py-4 px-5 text-center mb-6 border border-slate-100 dark:border-slate-700/60">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            {e.codigoRef}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-black text-[#0e3a8c] dark:text-blue-400 tracking-wider">
              {resultado.referencia}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(resultado.referencia)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 dark:text-slate-500"
              title={idioma === 'es' ? 'Copiar código' : 'Copy code'}
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <img
              src={qrSrc}
              alt="QR"
              className="w-44 h-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2 shadow-inner"
            />
          </div>
        </div>

        <div className="mb-5 bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">{e.totalEstimado}:</span>
            <span className="text-xl font-black text-[#0e3a8c] dark:text-blue-400">
              ${resultado.cotizacion.toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')} COP
            </span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-start gap-2.5 mb-6">
          <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-base mt-0.5 shrink-0">info</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-[#0e3a8c] dark:text-blue-400">{idioma === 'es' ? 'Recuerda:' : 'Remember:'}</span> {e.instruccionesOficina}
          </p>
        </div>

        <Link
          to={ROUTES.MIS_ENCOMIENDAS}
          className="w-full block text-center bg-[#0e3a8c] dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-blue-900/20 text-sm mb-2"
        >
          {idioma === 'es' ? 'Ver mis encomiendas' : 'View my parcels'}
        </Link>
        <button
          onClick={onVolver}
          className="w-full text-slate-500 dark:text-slate-400 font-bold py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          {e.volverInicio}
        </button>
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
    oficinas,
    loadingOficinas,
    errorOficinas,
    cargarOficinas,
    cotizacion,
    loadingCotizacion,
    errorCotizacion,
    cotizarConDebounce,
    limpiarCotizacion,
    loadingEnvio,
    errorEnvio,
    resultado,
    enviarPreinscripcion,
    reiniciar,
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
    if (
      idOficinaOrigen === '' ||
      idOficinaDestino === '' ||
      pesoEstimado === '' ||
      idOficinaOrigen === idOficinaDestino
    ) {
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

  const camposCompletos = () =>
    idOficinaOrigen !== '' &&
    idOficinaDestino !== '' &&
    destinatarioNombre.trim() !== '' &&
    destinatarioDocumento.trim() !== '' &&
    destinatarioTelefono.trim() !== '' &&
    pesoEstimado !== '' &&
    descripcion.trim() !== '';

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
      // errorEnvio
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

  const nombreOficinaOrigen = oficinas.find((o) => o.idoficinaencomienda === idOficinaOrigen)?.nombreciudad;
  const nombreOficinaDestino = oficinas.find((o) => o.idoficinaencomienda === idOficinaDestino)?.nombreciudad;

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
                idOficinaOrigen,
                idOficinaDestino,
                destinatarioNombre,
                destinatarioDocumento,
                destinatarioTelefono,
                entrega,
                direccion,
                pesoEstimado,
                volumenEstimado,
                valorDeclarado,
                descripcion,
                categoria,
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

          <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full pb-28 sm:pb-16 flex-1">
            {/* Breadcrumb & Header */}
            <div className="mb-6">
              <nav className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5 uppercase">
                <Link to={ROUTES.HOME} className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors">
                  {idioma === 'es' ? 'Inicio' : 'Home'}
                </Link>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span>{idioma === 'es' ? 'Servicios' : 'Services'}</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-[#0e3a8c] dark:text-blue-400 font-extrabold">{e.titulo}</span>
              </nav>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {e.titulo}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {idioma === 'es'
                      ? 'Calcula la tarifa en tiempo real y preinscribe tu paquete de forma rápida.'
                      : 'Calculate rates in real time and register your parcel easily.'}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto shadow-xs">
                  <Link
                    to={ROUTES.ENCOMIENDAS}
                    className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-extrabold transition-all bg-[#0e3a8c] dark:bg-blue-600 text-white shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    {tx.navbar.cotizarEncomienda}
                  </Link>
                  <Link
                    to={ROUTES.MIS_ENCOMIENDAS}
                    className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-base">history</span>
                    {tx.navbar.misEncomiendas}
                  </Link>
                </div>
              </div>
            </div>

            {/* Main 2-Column Responsive Grid */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* ── Left Column: Form Sections (8 Cols) ── */}
                <div className="lg:col-span-8 space-y-6">

                  {/* 1. Remitente & Destinatario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Remitente */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 space-y-3.5 shadow-xs transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">person</span>
                          </div>
                          <span className="text-xs font-extrabold text-[#0e3a8c] dark:text-blue-400 uppercase tracking-wider">
                            {e.remitente}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                          {idioma === 'es' ? 'Tu cuenta' : 'Your account'}
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          {e.nombreCompleto}
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario Cootranar'}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none cursor-not-allowed border border-slate-200/60 dark:border-slate-600/60"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            {e.cedula}
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={usuario?.documento ?? '—'}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed border border-slate-200/60 dark:border-slate-600/60 truncate"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            {idioma === 'es' ? 'Teléfono' : 'Phone'}
                          </label>
                          <input
                            type="tel"
                            readOnly
                            value={usuario?.telefono ?? '—'}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-not-allowed border border-slate-200/60 dark:border-slate-600/60 truncate"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Destinatario */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 space-y-3.5 shadow-xs transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">person_pin</span>
                          </div>
                          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                            {e.destinatario}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase">
                          * {idioma === 'es' ? 'Obligatorio' : 'Required'}
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          {e.quienRecibe} *
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                            badge
                          </span>
                          <input
                            type="text"
                            placeholder={idioma === 'es' ? 'Nombre y apellido del destinatario' : 'Recipient full name'}
                            value={destinatarioNombre}
                            onChange={(ev) => setDestinatarioNombre(ev.target.value)}
                            required
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/60 dark:border-slate-600/60 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            {e.documentoDestinatario} *
                          </label>
                          <input
                            type="text"
                            placeholder="C.C. / NIT"
                            value={destinatarioDocumento}
                            onChange={(ev) => setDestinatarioDocumento(ev.target.value)}
                            required
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/60 dark:border-slate-600/60 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            {idioma === 'es' ? 'Teléfono' : 'Phone'} *
                          </label>
                          <input
                            type="tel"
                            placeholder="300 000 0000"
                            value={destinatarioTelefono}
                            onChange={(ev) => setDestinatarioTelefono(ev.target.value)}
                            required
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/60 dark:border-slate-600/60 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Información de Envío y Trayecto */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-6 space-y-5 shadow-xs transition-colors">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/70">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-base">route</span>
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {e.infoEnvio}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {idioma === 'es' ? 'Selecciona las oficinas de despacho y recepción' : 'Select dispatch and receiving offices'}
                        </p>
                      </div>
                    </div>

                    {/* Oficinas Origen & Destino */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0e3a8c] dark:bg-blue-400" />
                          {e.oficinaOrigen} *
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none">
                            store
                          </span>
                          <select
                            value={idOficinaOrigen}
                            required
                            disabled={loadingOficinas}
                            onChange={(ev) => setIdOficinaOrigen(ev.target.value === '' ? '' : Number(ev.target.value))}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 rounded-xl pl-9 pr-8 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 appearance-none text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-600/70 disabled:opacity-60 cursor-pointer"
                          >
                            <option value="" className="dark:bg-slate-800">
                              {loadingOficinas ? e.cargandoOficinas : e.seleccionarOficina}
                            </option>
                            {oficinas.map((o) => (
                              <option key={o.idoficinaencomienda} value={o.idoficinaencomienda} className="dark:bg-slate-800">
                                {o.nombreciudad} — {o.direccion}
                              </option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
                            expand_more
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {e.oficinaDestino} *
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base pointer-events-none">
                            pin_drop
                          </span>
                          <select
                            value={idOficinaDestino}
                            required
                            disabled={loadingOficinas}
                            onChange={(ev) => setIdOficinaDestino(ev.target.value === '' ? '' : Number(ev.target.value))}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 rounded-xl pl-9 pr-8 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 appearance-none text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-600/70 disabled:opacity-60 cursor-pointer"
                          >
                            <option value="" className="dark:bg-slate-800">
                              {loadingOficinas ? e.cargandoOficinas : e.seleccionarOficina}
                            </option>
                            {oficinas.map((o) => (
                              <option key={o.idoficinaencomienda} value={o.idoficinaencomienda} className="dark:bg-slate-800">
                                {o.nombreciudad} — {o.direccion}
                              </option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {errorOficinas && <p className="text-xs text-red-500 font-semibold">{errorOficinas}</p>}

                    {/* Modalidad de entrega */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2.5 block">
                        {e.modalidad}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEntrega('Oficina')}
                          className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                            entrega === 'Oficina'
                              ? 'bg-blue-50/70 dark:bg-blue-950/60 border-[#0e3a8c] dark:border-blue-500 ring-2 ring-[#0e3a8c]/20'
                              : 'bg-[#f6f6f8] dark:bg-slate-700/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              entrega === 'Oficina'
                                ? 'bg-[#0e3a8c] text-white'
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">storefront</span>
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                              {idioma === 'es' ? 'Entrega en Oficina' : 'Office Pick-up'}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {idioma === 'es' ? 'El destinatario retira en taquilla' : 'Recipient picks up at office'}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEntrega('Domicilio')}
                          className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${
                            entrega === 'Domicilio'
                              ? 'bg-teal-50/70 dark:bg-teal-950/60 border-teal-600 dark:border-teal-500 ring-2 ring-teal-600/20'
                              : 'bg-[#f6f6f8] dark:bg-slate-700/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              entrega === 'Domicilio'
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                              {idioma === 'es' ? 'Entrega a Domicilio' : 'Home Delivery'}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {idioma === 'es' ? 'Envío directo a la dirección' : 'Direct delivery to address'}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Dirección Domicilio */}
                    {entrega === 'Domicilio' && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/70 animate-fadeIn">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                          {idioma === 'es' ? 'Dirección del destinatario' : 'Recipient address'} *
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base">
                            home_pin
                          </span>
                          <input
                            type="text"
                            placeholder={idioma === 'es' ? 'Dirección exacta, Barrio, Ciudad' : 'Full address, Neighborhood, City'}
                            value={direccion}
                            onChange={(ev) => setDireccion(ev.target.value)}
                            required
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/70 dark:border-slate-600/70 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Detalles del Paquete */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 sm:p-6 space-y-5 shadow-xs transition-colors">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/70">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-base">inventory_2</span>
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {e.detallesPaquete}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {idioma === 'es' ? 'Dimensiones, peso estimado y descripción del artículo' : 'Dimensions, estimated weight, and description'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Peso */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                          {e.peso} *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            placeholder="0.00"
                            value={pesoEstimado}
                            required
                            onChange={(ev) => setPesoEstimado(ev.target.value === '' ? '' : Number(ev.target.value))}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/70 dark:border-slate-600/70 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-10"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 dark:text-slate-500">
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Volumen */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                          {e.volumenEstimado}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            value={volumenEstimado}
                            onChange={(ev) => setVolumenEstimado(ev.target.value === '' ? '' : Number(ev.target.value))}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/70 dark:border-slate-600/70 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-10"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 dark:text-slate-500">
                            m³
                          </span>
                        </div>
                      </div>

                      {/* Valor Declarado */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                          {e.valorDeclarado}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 dark:text-slate-500">
                            $
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            placeholder="0"
                            value={valorDeclarado}
                            onChange={(ev) => setValorDeclarado(ev.target.value === '' ? '' : Number(ev.target.value))}
                            className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/70 dark:border-slate-600/70 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descripción del artículo */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        {e.descripcion} *
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base">
                          edit_note
                        </span>
                        <input
                          type="text"
                          placeholder={idioma === 'es' ? 'Ej. Computador portátil, Ropa nueva, Documentos legales' : 'e.g. Laptop, Clothes, Documents'}
                          value={descripcion}
                          required
                          onChange={(ev) => setDescripcion(ev.target.value)}
                          className="w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 border border-slate-200/70 dark:border-slate-600/70 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {/* Categorías */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                        {e.categoria}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIAS.map((cat) => {
                          const translatedLabel =
                            cat.label === 'Tecnología'
                              ? idioma === 'es'
                                ? 'Tecnología'
                                : 'Technology'
                              : cat.label === 'Ropa'
                              ? idioma === 'es'
                                ? 'Ropa'
                                : 'Clothing'
                              : cat.label === 'Documentos'
                              ? idioma === 'es'
                                ? 'Documentos'
                                : 'Documents'
                              : cat.label === 'Frágil'
                              ? idioma === 'es'
                                ? 'Frágil'
                                : 'Fragile'
                              : idioma === 'es'
                              ? 'Otro'
                              : 'Other';

                          const isSelected = categoria === cat.label;
                          return (
                            <button
                              key={cat.label}
                              type="button"
                              onClick={() => setCategoria(isSelected ? '' : cat.label)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white border-[#0e3a8c] dark:border-blue-600 shadow-sm shadow-blue-900/20'
                                  : 'bg-[#f6f6f8] dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#0e3a8c] dark:hover:border-blue-400'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                              {translatedLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Notice Box */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">info</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-[#0e3a8c] dark:text-blue-400">NOTA: </span>
                      {idioma === 'es'
                        ? 'El precio final puede variar sujeto a verificación de peso y dimensiones físicas en taquilla.'
                        : 'The final price may vary subject to weight and dimensions verification at the counter.'}
                    </p>
                  </div>

                  {validacionMsg && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
                      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-semibold">
                        {validacionMsg}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Right Column: Sticky Live Quote Summary (4 Cols) ── */}
                <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700/80 p-6 shadow-lg shadow-slate-200/50 dark:shadow-none transition-colors">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/70">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-base">receipt_long</span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          {e.resumen}
                        </h3>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0e3a8c] dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                        {idioma === 'es' ? 'En Vivo' : 'Live'}
                      </span>
                    </div>

                    {/* Live Trayecto Snapshot */}
                    <div className="py-4 space-y-3 border-b border-slate-100 dark:border-slate-700/70 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          {e.rutaEnvio}
                        </span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate max-w-[170px]">
                          {nombreOficinaOrigen && nombreOficinaDestino
                            ? `${nombreOficinaOrigen} → ${nombreOficinaDestino}`
                            : '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          {e.modalidad}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {entrega === 'Oficina' ? (idioma === 'es' ? 'En Oficina' : 'Office') : (idioma === 'es' ? 'A Domicilio' : 'Home Delivery')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          {e.peso}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {pesoEstimado ? `${pesoEstimado} kg` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Total Estimado Box */}
                    <div className="my-5 bg-gradient-to-br from-[#0e3a8c]/10 via-blue-500/5 to-transparent dark:from-blue-950/50 dark:to-slate-900/50 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-center">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {e.totalEstimado}
                      </p>
                      {loadingCotizacion ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-slate-500">
                          <span className="material-symbols-outlined animate-spin text-lg text-[#0e3a8c] dark:text-blue-400">
                            progress_activity
                          </span>
                          <span className="text-xs font-semibold">{e.calculando}</span>
                        </div>
                      ) : errorCotizacion ? (
                        <p className="text-xs font-semibold text-red-500 py-1">{errorCotizacion}</p>
                      ) : (
                        <div className="py-1">
                          <p className="text-3xl font-black text-[#0e3a8c] dark:text-blue-400 tracking-tight">
                            ${(cotizacion ?? 0).toLocaleString(idioma === 'es' ? 'es-CO' : 'en-US')}
                          </p>
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            COP (Pesos Colombianos)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={loadingCotizacion || loadingEnvio}
                      className="w-full bg-gradient-to-r from-[#0e3a8c] to-[#1a4ea8] hover:from-[#092b6b] hover:to-[#133d85] dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-blue-900/25 hover:shadow-lg flex items-center justify-center gap-2 active:scale-98 group"
                    >
                      <span>{e.generarBtn}</span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>

                    {/* Guarantees */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/70 space-y-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-sm">verified_user</span>
                        <span>{idioma === 'es' ? 'Garantía y seguridad de despacho Cootranar' : 'Cootranar security guarantee'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-sm">qr_code_scanner</span>
                        <span>{idioma === 'es' ? 'Código QR para despacho ágil en oficina' : 'QR code for quick desk drop-off'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500 text-sm">fmd_good</span>
                        <span>{idioma === 'es' ? 'Rastreo en línea de tu paquete' : 'Online parcel tracking'}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </main>
        </>
      )}
    </div>
  );
}
