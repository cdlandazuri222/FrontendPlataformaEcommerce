import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { millasApi, type MillasResumen, type MovimientoMilla, type NivelBeneficio, type EstimadoMillas, type RecompensaCatalogo, type ConfiguracionPublicaMillas, type CuponMillas } from '../../../infrastructure/api/millasApi';
import { ROUTES } from '../../../shared/constants';
import logoImg from '../../../assets/Logo.png.png';

export function MillasPage() {
  const navigate = useNavigate();
  const { getUsuario } = useAuth();
  const { idioma, tx } = usePreferencias();
  const m = tx.millas;

  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState<MillasResumen | null>(null);
  const [historial, setHistorial] = useState<MovimientoMilla[]>([]);
  const [niveles, setNiveles] = useState<NivelBeneficio[]>([]);
  const [filtroHistorial, setFiltroHistorial] = useState<'TODOS' | 'ACUMULACION' | 'CANJE'>('TODOS');

  // Catálogo y textos configurados desde el sistema interno
  const [recompensas, setRecompensas] = useState<RecompensaCatalogo[]>([]);
  const [configPrograma, setConfigPrograma] = useState<ConfiguracionPublicaMillas | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Cupones y Canjes del Usuario
  const [misCupones, setMisCupones] = useState<CuponMillas[]>([]);
  const [procesandoCanje, setProcesandoCanje] = useState(false);
  const [cuponGenerado, setCuponGenerado] = useState<{
    codigoCupon: string;
    titulo: string;
    millasCanjeadas: number;
    valorDescuentoCop: number;
    fechaVencimiento: string;
    saldoRestante: number;
  } | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estados de la calculadora interactiva
  const [montoSimulado, setMontoSimulado] = useState<number>(45000);
  const [estimado, setEstimado] = useState<EstimadoMillas | null>(null);
  const [calculandoSimulador, setCalculandoSimulador] = useState(false);

  // Estado para modal de canje
  const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<RecompensaCatalogo | null>(null);

  const formatNum = (val: number | null | undefined): string => {
    if (val === null || val === undefined || !isFinite(val)) return '0';
    return Number(val).toLocaleString('es-CO');
  };

  useEffect(() => {
    const user = getUsuario();
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [dataResumen, dataHistorial, dataNiveles, dataRecompensas, dataConfig, dataCupones] = await Promise.all([
          millasApi.obtenerResumen(),
          millasApi.obtenerHistorial(),
          millasApi.obtenerNiveles(),
          millasApi.obtenerRecompensas(),
          millasApi.obtenerConfiguracionPublica(),
          millasApi.obtenerMisCupones().catch(() => [])
        ]);
        setResumen(dataResumen);
        setHistorial(dataHistorial);
        setNiveles(dataNiveles);
        setRecompensas(dataRecompensas);
        setConfigPrograma(dataConfig);
        setMisCupones(dataCupones || []);
        setErrorCarga(null);
      } catch (error) {
        // Antes se mostraba un resumen inventado de 150 millas, lo que hacía que
        // un fallo de API se viera igual que "no tengo millas". Ahora se avisa.
        console.error('Error cargando datos de millas:', error);
        setErrorCarga(
          idioma === 'es'
            ? 'No pudimos cargar tu información de millas. Intenta de nuevo en unos minutos.'
            : 'We could not load your miles information. Please try again in a few minutes.'
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [navigate, idioma]);

  // Ejecutar cálculo al cambiar el monto simulado
  useEffect(() => {
    const calcular = async () => {
      if (montoSimulado <= 0) return;
      setCalculandoSimulador(true);
      try {
        const est = await millasApi.calcularEstimado(montoSimulado);
        setEstimado(est);
      } catch {
        // Fallback local
        const base = Math.floor(montoSimulado / 100);
        setEstimado({
          montoCop: montoSimulado,
          millasBase: base,
          porcentajeRetorno: '10%',
          equivalenciaDescuentoCop: base * 10,
          nivelesEstimados: [
            { nivel: 'Bronce', multiplicador: 1.0, millasConMultiplicador: base, descuentoFuturoCop: base * 10 },
            { nivel: 'Plata', multiplicador: 1.1, millasConMultiplicador: Math.floor(base * 1.1), descuentoFuturoCop: Math.floor(base * 1.1) * 10 },
            { nivel: 'Oro', multiplicador: 1.25, millasConMultiplicador: Math.floor(base * 1.25), descuentoFuturoCop: Math.floor(base * 1.25) * 10 },
            { nivel: 'Platino VIP', multiplicador: 1.5, millasConMultiplicador: Math.floor(base * 1.5), descuentoFuturoCop: Math.floor(base * 1.5) * 10 },
          ]
        });
      } finally {
        setCalculandoSimulador(false);
      }
    };

    const timer = setTimeout(calcular, 300);
    return () => clearTimeout(timer);
  }, [montoSimulado]);

  const movimientosFiltrados = historial.filter((item) => {
    if (filtroHistorial === 'TODOS') return true;
    return item.tipo === filtroHistorial;
  });

  // Catálogo y textos administrables. Si la configuración no llega, se usan los
  // textos de i18n y los montos por defecto para no dejar la página vacía.
  const tituloPrograma = configPrograma?.nombrePrograma || m.titulo;
  const subtituloPrograma = configPrograma?.subtitulo || m.subtitulo;
  const montosRapidos = configPrograma?.montosRapidos?.length
    ? configPrograma.montosRapidos
    : [25000, 45000, 70000, 110000];

  const handleCanjear = (rec: RecompensaCatalogo) => {
    setRecompensaSeleccionada(rec);
  };

  const confirmarCanje = async () => {
    if (!resumen || !recompensaSeleccionada) return;
    if (resumen.saldoMillas < recompensaSeleccionada.millasRequeridas) {
      alert(idioma === 'es' 
        ? `Saldo insuficiente. Tienes ${formatNum(resumen.saldoMillas)} millas y requieres ${formatNum(recompensaSeleccionada.millasRequeridas)} millas.`
        : `Insufficient miles. You have ${formatNum(resumen.saldoMillas)} miles and need ${formatNum(recompensaSeleccionada.millasRequeridas)} miles.`
      );
      return;
    }

    setProcesandoCanje(true);
    try {
      const res = await millasApi.canjearRecompensa(recompensaSeleccionada.idRecompensa);
      setCuponGenerado(res);
      setResumen(prev => prev ? { ...prev, saldoMillas: res.saldoRestante } : null);
      setRecompensaSeleccionada(null);
      // Refrescar historial y cupones
      const [nuevoHistorial, nuevosCupones] = await Promise.all([
        millasApi.obtenerHistorial().catch(() => []),
        millasApi.obtenerMisCupones().catch(() => [])
      ]);
      if (nuevoHistorial.length) setHistorial(nuevoHistorial);
      if (nuevosCupones.length) setMisCupones(nuevosCupones);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al procesar el canje';
      alert(msg);
    } finally {
      setProcesandoCanje(false);
    }
  };

  const copiarAlPortapapeles = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiadoId(codigo);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  // Determinar estilos visuales de la tarjeta VIP con la paleta oficial de Cootranar (Rojo #c62828 y Azul #0e3a8c)
  const getCardTheme = (nivelId: string = 'BRONCE') => {
    switch (nivelId) {
      case 'PLATINO':
        return {
          gradient: 'from-[#050c1e] via-[#0a1e45] to-[#040915]',
          border: 'border-blue-400/50 shadow-xl shadow-blue-950/40',
          accent: 'text-blue-300',
          badge: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-[#c62828] text-white border border-white/30 shadow-xs',
          chip: 'from-amber-200 to-yellow-400',
          glow1: 'bg-blue-500/25',
          glow2: 'bg-[#c62828]/25'
        };
      case 'ORO':
        return {
          gradient: 'from-[#0e172a] via-[#1a233d] to-[#0a1224]',
          border: 'border-amber-400/70 shadow-xl shadow-amber-950/30',
          accent: 'text-amber-300',
          badge: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black border border-amber-300/80 shadow-xs',
          chip: 'from-amber-200 to-yellow-500',
          glow1: 'bg-amber-500/20',
          glow2: 'bg-[#c62828]/25'
        };
      case 'PLATA':
        return {
          gradient: 'from-[#0d182b] via-[#162744] to-[#091222]',
          border: 'border-slate-300/60 shadow-xl shadow-slate-950/30',
          accent: 'text-slate-200',
          badge: 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 font-black border border-white/70 shadow-xs',
          chip: 'from-slate-200 to-slate-400',
          glow1: 'bg-slate-300/20',
          glow2: 'bg-[#0e3a8c]/40'
        };
      default: // BRONCE (Identidad Institucional Cootranar: Azul Marino y Rojo Corporativo)
        return {
          gradient: 'from-[#0a1c3d] via-[#102b5c] to-[#07152f]',
          border: 'border-red-500/40 shadow-xl shadow-red-950/20',
          accent: 'text-red-300',
          badge: 'bg-gradient-to-r from-[#c62828] to-[#b71c1c] text-white font-black border border-red-400/60 shadow-xs',
          chip: 'from-amber-300 to-yellow-500',
          glow1: 'bg-[#c62828]/25',
          glow2: 'bg-[#0e3a8c]/40'
        };
    }
  };

  const cardTheme = getCardTheme(resumen?.nivel.id);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f8fafd] dark:bg-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 border-4 border-[#0e3a8c] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600 dark:text-slate-300 font-bold text-base">
            {idioma === 'es' ? 'Cargando tu panel de millas...' : 'Loading your miles dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafd] dark:bg-slate-900 transition-colors duration-200 pb-28 sm:pb-16">
      <Navbar />

      {/* ── Aviso de error de carga ── */}
      {errorCarga && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
            <span className="material-symbols-outlined text-[#c62828] dark:text-red-400">error</span>
            <div>
              <p className="text-sm font-bold text-[#c62828] dark:text-red-300">
                {idioma === 'es' ? 'No pudimos cargar tus millas' : 'We could not load your miles'}
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">{errorCarga}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Programa desactivado por el administrador ── */}
      {configPrograma && !configPrograma.programaActivo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">pause_circle</span>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {idioma === 'es'
                ? 'El programa de millas está temporalmente suspendido. Tu saldo se conserva.'
                : 'The miles program is temporarily paused. Your balance is preserved.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmación de Canje ── */}
      {recompensaSeleccionada && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#c62828] dark:text-red-400 flex items-center justify-center mb-5 mx-auto">
              <span className="material-symbols-outlined text-3xl">{recompensaSeleccionada.icono || 'redeem'}</span>
            </div>
            
            <h3 className="text-xl font-black text-center text-[#131b3e] dark:text-white mb-2">
              {idioma === 'es' ? 'Confirmar Canje de Millas' : 'Confirm Miles Redemption'}
            </h3>
            
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
              {recompensaSeleccionada.descripcion || recompensaSeleccionada.titulo}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-4 mb-6 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{idioma === 'es' ? 'Millas requeridas:' : 'Required miles:'}</span>
                <span className="font-extrabold text-red-600 dark:text-red-400 text-sm">
                  {formatNum(recompensaSeleccionada.millasRequeridas)} pts
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{idioma === 'es' ? 'Tu saldo disponible:' : 'Your available balance:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatNum(resumen?.saldoMillas)} pts
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{idioma === 'es' ? 'Saldo restante estimado:' : 'Estimated remaining:'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatNum(Math.max((resumen?.saldoMillas || 0) - recompensaSeleccionada.millasRequeridas, 0))} pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={procesandoCanje}
                onClick={() => setRecompensaSeleccionada(null)}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              >
                {idioma === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={procesandoCanje}
                onClick={confirmarCanje}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c62828] to-[#b71c1c] text-white font-extrabold text-xs shadow-md hover:from-red-800 hover:to-red-900 transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {procesandoCanje ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>{m.procesandoCanje}</span>
                  </>
                ) : (
                  <span>{idioma === 'es' ? 'Confirmar Canje' : 'Confirm'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Cupón Generado Exitosamente ── */}
      {cuponGenerado && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl animate-scaleUp text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-4xl">celebration</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {m.cuponGenerado}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {cuponGenerado.titulo}
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/60 mb-6">
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 mb-1">
                {idioma === 'es' ? 'Tu Código de Cupón' : 'Your Voucher Code'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-black text-slate-900 dark:text-white tracking-wider">
                  {cuponGenerado.codigoCupon}
                </span>
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(cuponGenerado.codigoCupon)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  title={m.copiarCodigo}
                >
                  <span className="material-symbols-outlined text-base">
                    {copiadoId === cuponGenerado.codigoCupon ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              {copiadoId === cuponGenerado.codigoCupon && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1">
                  {m.codigoCopiado}
                </p>
              )}
              {cuponGenerado.fechaVencimiento && (
                <p className="text-[10px] text-slate-400 mt-2">
                  {idioma === 'es' ? 'Válido hasta: ' : 'Valid until: '}
                  {new Date(cuponGenerado.fechaVencimiento).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setCuponGenerado(null);
                  navigate(ROUTES.HOME);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c62828] to-[#b71c1c] text-white font-extrabold text-xs shadow-md hover:from-red-800 hover:to-red-900 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{m.usarEnReserva}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={() => setCuponGenerado(null)}
                className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold transition-colors"
              >
                {idioma === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Encabezado Principal con Colores Corporativos ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-[#c62828] dark:text-red-400 border border-red-200/80 dark:border-red-900/60 text-xs font-black tracking-wider uppercase mb-2 shadow-2xs">
              <span className="material-symbols-outlined text-sm text-[#c62828] dark:text-red-400">stars</span>
              <span>Club Cootranar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0e3a8c] dark:text-white tracking-tight">
              {tituloPrograma}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {subtituloPrograma}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c62828] to-[#b71c1c] hover:from-[#b71c1c] hover:to-[#8e0000] text-white text-xs font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-red-900/25 transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-base">airplane_ticket</span>
              <span>{idioma === 'es' ? 'Comprar Viaje y Acumular' : 'Book Trip & Earn'}</span>
            </button>
          </div>
        </div>

        {/* ── Grid Principal: Tarjeta VIP Cootranar + Estadísticas Clave ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* ── Columna Izquierda: Tarjeta de Membresía Digital VIP Cootranar ── */}
          <div className="lg:col-span-5 flex flex-col">
            <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br ${cardTheme.gradient} border ${cardTheme.border} text-white shadow-2xl shadow-slate-900/20 flex flex-col justify-between min-h-[250px] sm:min-h-[270px]`}>
              
              {/* Efectos de brillo de fondo en Rojo Cootranar y Azul Institucional */}
              <div className={`absolute -top-24 -right-24 w-64 h-64 ${cardTheme.glow1} rounded-full blur-3xl pointer-events-none`} />
              <div className={`absolute -bottom-24 -left-24 w-64 h-64 ${cardTheme.glow2} rounded-full blur-3xl pointer-events-none`} />
              
              {/* Franja decorativa sutil en la tarjeta */}
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

              {/* Header de la tarjeta con Logo Oficial Cootranar */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/95 rounded-xl px-2.5 py-1.5 shadow-md flex items-center justify-center">
                    <img src={logoImg} alt="Cootranar" className="h-6 sm:h-7 w-auto object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest font-black uppercase text-red-300 block drop-shadow-xs">
                      COOTRANAR FREQUENT TRAVELER
                    </span>
                    <span className="text-xs font-bold text-white/95 tracking-wide">
                      Club Pasajero VIP
                    </span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${cardTheme.badge}`}>
                  {resumen?.nivel.nombre || 'Bronce'}
                </span>
              </div>

              {/* Chip virtual e Info Central */}
              <div className="my-6 relative z-10 flex items-center justify-between">
                <div className={`w-12 h-9 rounded-md bg-gradient-to-br ${cardTheme.chip} p-1 shadow-inner flex items-center justify-center opacity-95 border border-amber-200/50`}>
                  <div className="w-full h-full border border-black/25 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                    <div className="border-r border-black/25" />
                    <div className="border-l border-black/25" />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-widest">
                    {m.saldoActual}
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {formatNum(resumen?.saldoMillas)} <span className="text-base sm:text-lg font-black text-amber-300">pts</span>
                  </span>
                </div>
              </div>

              {/* Footer de la tarjeta */}
              <div className="relative z-10 pt-2 border-t border-white/15 flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-300 block tracking-wider">
                    {idioma === 'es' ? 'Titular de la Membresía' : 'Cardholder'}
                  </span>
                  <span className="text-sm font-black uppercase tracking-wider text-white">
                    {resumen?.usuario.nombre} {resumen?.usuario.apellido}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-300 block tracking-wider">
                    {m.socioNum}
                  </span>
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-200">
                    {resumen?.usuario.numeroSocio}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Progreso hacia el siguiente nivel */}
            {resumen?.siguienteNivel ? (
              <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex justify-between items-center text-xs mb-2 font-bold">
                  <span className="text-slate-600 dark:text-slate-300">
                    {m.proximoNivel}: <strong className="text-[#0e3a8c] dark:text-blue-400">{resumen.siguienteNivel.nombre}</strong>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {resumen.siguienteNivel.progreso}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#c62828] via-[#e53935] to-[#0e3a8c] rounded-full transition-all duration-500"
                    style={{ width: `${resumen.siguienteNivel.progreso}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  {m.faltanMillas} <strong className="text-slate-800 dark:text-slate-200">{formatNum(resumen.siguienteNivel.millasFaltantes)}</strong> {m.paraAlcanzar} <strong className="text-[#c62828] dark:text-red-400">{resumen.siguienteNivel.nombre}</strong>.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-950/40 dark:to-blue-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-[#0e3a8c] dark:text-blue-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c62828] text-lg">workspace_premium</span>
                <span>{m.maximoNivel}</span>
              </div>
            )}
          </div>

          {/* ── Columna Derecha: Tarjetas de Estadísticas y Ahorro ── */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Saldo y Equivalente en Dinero */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {m.equivalencia}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#131b3e] dark:text-white tracking-tight">
                  ${formatNum(resumen?.valorEquivalenteCop)} <span className="text-xs font-bold text-slate-400">COP</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {idioma === 'es' ? 'Disponibles para descontar en tu próxima reserva' : 'Available for discounts on your next trip'}
                </p>
              </div>
            </div>

            {/* Card 2: Viajes Realizados */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {m.totalViajes}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">commute</span>
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#131b3e] dark:text-white tracking-tight">
                  {resumen?.estadisticas.totalViajes || 0} <span className="text-xs font-bold text-slate-400">{idioma === 'es' ? 'viajes' : 'trips'}</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  +{formatNum(resumen?.estadisticas?.millasPorViajes)} {idioma === 'es' ? 'millas acumuladas en ruta' : 'miles earned in routes'}
                </p>
              </div>
            </div>

            {/* Card 3: Multiplicador del Nivel */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  Multiplicador Activo
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">bolt</span>
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#131b3e] dark:text-white tracking-tight">
                  {resumen?.nivel.multiplicador}x <span className="text-xs font-bold text-slate-400">{idioma === 'es' ? 'en tus viajes' : 'on your trips'}</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {idioma === 'es' ? `Nivel ${resumen?.nivel.nombre}: acumulas más rápido` : `${resumen?.nivel.nombre} Tier: earn points faster`}
                </p>
              </div>
            </div>

            {/* Card 4: Bono de Registro (Acento Rojo Cootranar) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {m.bonos}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#c62828] dark:text-red-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">card_giftcard</span>
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#131b3e] dark:text-white tracking-tight">
                  {resumen?.estadisticas.bonoBienvenida || 150} <span className="text-xs font-bold text-slate-400">pts</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {idioma === 'es' ? 'Bono otorgado por ser cliente registrado' : 'Welcome reward for being a member'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── SECCIÓN: CALCULADORA INTERACTIVA DE MILLAS CON IDENTIDAD COOTRANAR ── */}
        <div className="bg-gradient-to-br from-[#0e3a8c] via-[#092257] to-[#06163a] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-blue-800/40 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#c62828]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/15 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/30 text-red-100 border border-red-500/40 text-xs font-black mb-2 shadow-xs">
                <span className="material-symbols-outlined text-sm">calculate</span>
                <span>{m.simulador}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {m.simuladorDesc}
              </h2>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-blue-200">{idioma === 'es' ? 'Montos rápidos:' : 'Quick prices:'}</span>
              {montosRapidos.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMontoSimulado(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    montoSimulado === val
                      ? 'bg-[#c62828] text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  ${val.toLocaleString('es-CO')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
            {/* Input del simulador */}
            <div className="lg:col-span-5 space-y-4">
              <label className="text-xs font-bold text-blue-100 block">
                {m.ingresaMonto}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-base font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={montoSimulado || ''}
                  onChange={(e) => setMontoSimulado(Number(e.target.value))}
                  placeholder="Ej: 45000"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl pl-8 pr-4 py-3.5 text-lg font-black text-white outline-none focus:ring-2 focus:ring-white/40 transition-all placeholder:text-white/40"
                />
              </div>
              <p className="text-[11px] text-blue-200">
                {idioma === 'es' 
                  ? 'Por cada $100 COP gastados ganas 1 milla base. ¡Multiplica tus millas según tu nivel VIP!'
                  : 'For every $100 COP spent you earn 1 base mile. Multiply your points according to your VIP tier!'}
              </p>
            </div>

            {/* Resultados del simulador */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {estimado?.nivelesEstimados.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 flex flex-col justify-between text-center"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block mb-1">
                      {item.nivel} ({item.multiplicador}x)
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      +{calculandoSimulador ? '...' : item.millasConMultiplicador}
                    </span>
                    <span className="text-[10px] text-blue-200 block font-semibold">millas</span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/10 text-[10px] text-emerald-300 font-bold">
                    -${calculandoSimulador ? '...' : formatNum(item.descuentoFuturoCop)} COP
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECCIÓN: RECOMPENSAS Y CANJE ── */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#131b3e] dark:text-white tracking-tight">
              {m.recompensas}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {idioma === 'es' ? 'Usa tus millas acumuladas para desbloquear pasajes gratis, descuentos y beneficios.' : 'Use your earned points to unlock free trips, discounts and perks.'}
            </p>
          </div>

          {recompensas.length === 0 && (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 block mb-2">redeem</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {idioma === 'es'
                  ? 'Por ahora no hay recompensas disponibles para canjear.'
                  : 'There are no rewards available to redeem right now.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recompensas.map((rec) => {
              const puedeCanjear = (resumen?.saldoMillas || 0) >= rec.millasRequeridas;
              return (
                <div
                  key={rec.idRecompensa}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#c62828] dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">{rec.icono || 'redeem'}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950/80 text-[#c62828] dark:text-red-300 border border-red-200/60 dark:border-red-900/60">
                        {rec.destacado ? (idioma === 'es' ? 'Popular' : 'Popular') : (rec.categoria || 'Canje')}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-[#131b3e] dark:text-white mb-1">
                      {rec.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                      {rec.descripcion}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Costo</span>
                      <span className="text-base font-black text-[#c62828] dark:text-red-400">
                        {formatNum(rec.millasRequeridas)} pts
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCanjear(rec)}
                      disabled={!puedeCanjear}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        puedeCanjear
                          ? 'bg-gradient-to-r from-[#c62828] to-[#b71c1c] hover:from-[#b71c1c] hover:to-[#8e0000] text-white shadow-md shadow-red-900/20 active:scale-95 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {puedeCanjear ? m.canjear : (idioma === 'es' ? 'Faltan pts' : 'Need pts')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECCIÓN: MIS CUPONES ACTIVOS ── */}
        {misCupones.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60 text-[10px] font-black uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-xs">confirmation_number</span>
                  <span>{idioma === 'es' ? 'Vouchers Disponibles' : 'Available Vouchers'}</span>
                </div>
                <h2 className="text-xl font-black text-[#0e3a8c] dark:text-white tracking-tight">
                  {m.misCupones}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {idioma === 'es' ? 'Cupones generados con tus millas listos para redimir en compras de viajes' : 'Vouchers generated with your points ready to redeem on trips'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {misCupones.map((cup) => {
                const esActivo = cup.estado === 'ACTIVO';
                return (
                  <div
                    key={cup.idCanje}
                    className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                      esActivo
                        ? 'bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800 dark:to-slate-800/80 border-amber-200 dark:border-amber-800/40 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          cup.estado === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : cup.estado === 'USADO'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {cup.estado}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {cup.fechaVencimiento ? `Vence: ${new Date(cup.fechaVencimiento).toLocaleDateString()}` : ''}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cup.titulo}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        {`$${formatNum(cup.valorDescuentoCop)} COP`}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 font-mono font-black text-xs text-amber-800 dark:text-amber-300 tracking-wider">
                        {cup.codigoCupon}
                      </div>

                      {esActivo && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copiarAlPortapapeles(cup.codigoCupon)}
                            title={m.copiarCodigo}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">
                              {copiadoId === cup.codigoCupon ? 'check' : 'content_copy'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(ROUTES.HOME)}
                            className="px-3 py-1.5 rounded-xl bg-[#0e3a8c] hover:bg-blue-900 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>{m.usarEnReserva}</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SECCIÓN: HISTORIAL DE MOVIMIENTOS CON ESTILO COOTRANAR ── */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#0e3a8c] dark:text-white tracking-tight">
                {m.historial}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {idioma === 'es' ? 'Detalle cronológico de puntos ganados y redimidos' : 'Chronological list of earned and redeemed points'}
              </p>
            </div>

            {/* Pestañas de filtro */}
            <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
              {(['TODOS', 'ACUMULACION', 'CANJE'] as const).map((filtro) => (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroHistorial(filtro)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filtroHistorial === filtro
                      ? 'bg-[#c62828] text-white shadow-xs font-black'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {filtro === 'TODOS' ? m.todas : filtro === 'ACUMULACION' ? m.acumuladas : m.canjeadas}
                </button>
              ))}
            </div>
          </div>

          {movimientosFiltrados.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">history</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {m.sinMovimientos}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {movimientosFiltrados.map((mov) => (
                <div key={mov.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      mov.tipo === 'ACUMULACION'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}>
                      <span className="material-symbols-outlined text-xl">{mov.icono || 'stars'}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {mov.concepto}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {mov.descripcion} • {new Date(mov.fecha).toLocaleDateString(idioma === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-base font-black ${
                      mov.tipo === 'ACUMULACION'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {mov.tipo === 'ACUMULACION' ? `+${mov.millas}` : `-${mov.millas}`} pts
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {mov.categoria}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SECCIÓN: NIVELES Y BENEFICIOS DEL PROGRAMA ── */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#131b3e] dark:text-white tracking-tight">
              {m.niveles}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {idioma === 'es'
                ? `Conoce los ${niveles.length || 4} escalones del Club Cootranar y sus beneficios exclusivos`
                : `Discover the ${niveles.length || 4} Cootranar Club tiers and their exclusive perks`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(niveles.length > 0 ? niveles : [
              {
                id: 'BRONCE',
                nombre: 'Bronce',
                minMillas: 0,
                maxMillas: 999,
                color: '#cd7f32',
                badgeBg: 'bg-amber-100 text-amber-900',
                multiplicador: 1.0,
                descuentoTiquetes: '0%',
                beneficios: [
                  '1 milla por cada $100 COP gastados',
                  'Acceso a promociones y tarifas especiales',
                  'Gestión digital y descarga de pasajes'
                ]
              },
              {
                id: 'PLATA',
                nombre: 'Plata',
                minMillas: 1000,
                maxMillas: 2999,
                color: '#a0aec0',
                badgeBg: 'bg-slate-200 text-slate-800',
                multiplicador: 1.1,
                descuentoTiquetes: '5%',
                beneficios: [
                  '5% de descuento en pasajes seleccionados',
                  'Multiplicador 1.1x en acumulación',
                  'Atención prioritaria digital',
                  'Cambios de horario sin penalidad'
                ]
              },
              {
                id: 'ORO',
                nombre: 'Oro',
                minMillas: 3000,
                maxMillas: 5999,
                color: '#d69e2e',
                badgeBg: 'bg-amber-200 text-amber-950',
                multiplicador: 1.25,
                descuentoTiquetes: '10%',
                beneficios: [
                  '10% de descuento en todos tus pasajes',
                  'Selección de asiento preferencial gratis',
                  'Multiplicador 1.25x en acumulación',
                  '5 kg adicionales de equipaje en bodega'
                ]
              },
              {
                id: 'PLATINO',
                nombre: 'Platino VIP',
                minMillas: 6000,
                maxMillas: Infinity,
                color: '#3182ce',
                badgeBg: 'bg-blue-100 text-blue-900',
                multiplicador: 1.5,
                descuentoTiquetes: '15%',
                beneficios: [
                  '15% de descuento permanente en pasajes',
                  'Abordaje prioritario VIP en terminales',
                  'Multiplicador 1.5x en acumulación',
                  '10 kg extra gratis en encomiendas',
                  'Asesor VIP personal Cootranar'
                ]
              }
            ]).map((nv) => {
              const esNivelActual = resumen?.nivel.id === nv.id;
              return (
                <div
                  key={nv.id}
                  className={`rounded-3xl p-6 border flex flex-col justify-between transition-all ${
                    esNivelActual
                      ? 'bg-gradient-to-b from-red-50/80 to-white dark:from-red-950/30 dark:to-slate-800 border-2 border-[#c62828] dark:border-red-500 shadow-lg ring-4 ring-red-500/15 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-xs opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${nv.badgeBg}`}>
                        {nv.nombre}
                      </span>
                      {esNivelActual && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-[#c62828] dark:text-red-400 uppercase tracking-wider bg-red-50 dark:bg-red-950 px-2.5 py-0.5 rounded-full border border-red-200/80 dark:border-red-900/60 shadow-2xs">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Tu Nivel
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-slate-400 block font-semibold">
                        {formatNum(nv.minMillas)} {!nv.maxMillas || !isFinite(nv.maxMillas) ? '+' : `- ${formatNum(nv.maxMillas)}`} millas
                      </span>
                      <span className="text-xl font-black text-[#131b3e] dark:text-white">
                        {nv.multiplicador}x <span className="text-xs font-semibold text-slate-400">acumulación</span>
                      </span>
                    </div>

                    <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                      {nv.beneficios.map((ben, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="material-symbols-outlined text-sm text-emerald-500 shrink-0 mt-0.5">check</span>
                          <span>{ben}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
