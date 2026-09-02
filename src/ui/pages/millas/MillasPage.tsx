import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { millasApi, type MillasResumen, type MovimientoMilla, type NivelBeneficio, type EstimadoMillas } from '../../../infrastructure/api/millasApi';
import { ROUTES } from '../../../shared/constants';

export function MillasPage() {
  const navigate = useNavigate();
  const { getUsuario } = useAuth();
  const usuario = getUsuario();
  const { idioma, tx } = usePreferencias();
  const m = tx.millas;

  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState<MillasResumen | null>(null);
  const [historial, setHistorial] = useState<MovimientoMilla[]>([]);
  const [niveles, setNiveles] = useState<NivelBeneficio[]>([]);
  const [filtroHistorial, setFiltroHistorial] = useState<'TODOS' | 'ACUMULACION' | 'CANJE'>('TODOS');

  // Estados de la calculadora interactiva
  const [montoSimulado, setMontoSimulado] = useState<number>(45000);
  const [estimado, setEstimado] = useState<EstimadoMillas | null>(null);
  const [calculandoSimulador, setCalculandoSimulador] = useState(false);

  // Estado para modal de canje
  const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<{
    titulo: string;
    millasRequeridas: number;
    beneficio: string;
    icono: string;
  } | null>(null);
  const [mensajeCanje, setMensajeCanje] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) {
      navigate(ROUTES.LOGIN);
      return;
    }

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [dataResumen, dataHistorial, dataNiveles] = await Promise.all([
          millasApi.obtenerResumen(),
          millasApi.obtenerHistorial(),
          millasApi.obtenerNiveles()
        ]);
        setResumen(dataResumen);
        setHistorial(dataHistorial);
        setNiveles(dataNiveles);
      } catch (error) {
        console.error('Error cargando datos de millas:', error);
        // Fallback datos locales si el endpoint responde error temporal
        if (usuario) {
          const fallbackResumen: MillasResumen = {
            usuario: {
              idUsuario: Number(usuario.id) || 1,
              nombre: usuario.nombre || 'Viajero',
              apellido: usuario.apellido || '',
              correo: usuario.correo || '',
              documento: usuario.documento || '',
              numeroSocio: `CTN-${String(usuario.id || '1').padStart(6, '0')}`
            },
            saldoMillas: 350,
            valorEquivalenteCop: 3500,
            nivel: {
              id: 'BRONCE',
              nombre: 'Bronce',
              multiplicador: 1.0,
              descuentoTiquetes: '0%',
              color: '#cd7f32',
              badgeBg: 'bg-amber-100 text-amber-900',
              beneficios: [
                'Acumulación base (1 milla por cada $100 COP)',
                'Acceso a promociones y tarifas especiales por temporada',
                'Gestión digital de viajes y descarga de tiquetes'
              ]
            },
            siguienteNivel: {
              id: 'PLATA',
              nombre: 'Plata',
              minMillas: 1000,
              millasFaltantes: 650,
              progreso: 35
            },
            estadisticas: {
              totalViajes: 1,
              millasPorViajes: 200,
              bonoBienvenida: 150,
              millasAcumuladasTotal: 350,
              millasCanjeadas: 0,
              ahorroTotalCop: 3500
            }
          };
          setResumen(fallbackResumen);
        }
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [usuario, navigate]);

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

  const handleCanjear = (recompensa: { titulo: string; millasRequeridas: number; beneficio: string; icono: string }) => {
    setRecompensaSeleccionada(recompensa);
  };

  const confirmarCanje = () => {
    if (!resumen || !recompensaSeleccionada) return;
    if (resumen.saldoMillas < recompensaSeleccionada.millasRequeridas) {
      alert(idioma === 'es' 
        ? `Saldo insuficiente. Tienes ${resumen.saldoMillas.toLocaleString('es-CO')} millas y requieres ${recompensaSeleccionada.millasRequeridas.toLocaleString('es-CO')} millas.`
        : `Insufficient miles. You have ${resumen.saldoMillas.toLocaleString('en-US')} miles and need ${recompensaSeleccionada.millasRequeridas.toLocaleString('en-US')} miles.`
      );
      return;
    }

    setMensajeCanje(idioma === 'es'
      ? `¡Felicidades! Has canjeado "${recompensaSeleccionada.titulo}". Te hemos enviado un cupón a tu correo.`
      : `Congratulations! You redeemed "${recompensaSeleccionada.titulo}". A voucher has been sent to your email.`
    );
    setRecompensaSeleccionada(null);
    setTimeout(() => setMensajeCanje(null), 5000);
  };

  // Determinar estilos visuales de la tarjeta VIP según nivel
  const getCardTheme = (nivelId: string = 'BRONCE') => {
    switch (nivelId) {
      case 'PLATINO':
        return {
          gradient: 'from-slate-900 via-blue-950 to-indigo-950',
          border: 'border-blue-400/40',
          accent: 'text-blue-300',
          badge: 'bg-blue-500/20 text-blue-200 border border-blue-400/30',
          chip: 'from-amber-200 to-yellow-400'
        };
      case 'ORO':
        return {
          gradient: 'from-[#382606] via-[#63470d] to-[#241703]',
          border: 'border-amber-400/50',
          accent: 'text-amber-300',
          badge: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
          chip: 'from-amber-200 to-yellow-500'
        };
      case 'PLATA':
        return {
          gradient: 'from-slate-800 via-slate-700 to-slate-900',
          border: 'border-slate-300/40',
          accent: 'text-slate-200',
          badge: 'bg-slate-500/20 text-slate-200 border border-slate-400/30',
          chip: 'from-slate-200 to-slate-400'
        };
      default: // BRONCE
        return {
          gradient: 'from-[#3a1d12] via-[#592d19] to-[#251109]',
          border: 'border-amber-600/40',
          accent: 'text-amber-400',
          badge: 'bg-amber-700/20 text-amber-300 border border-amber-600/30',
          chip: 'from-amber-400 to-yellow-600'
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

      {/* ── Modal de Confirmación de Canje ── */}
      {recompensaSeleccionada && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center mb-5 mx-auto">
              <span className="material-symbols-outlined text-3xl">{recompensaSeleccionada.icono}</span>
            </div>
            
            <h3 className="text-xl font-black text-center text-[#131b3e] dark:text-white mb-2">
              {idioma === 'es' ? 'Confirmar Canje de Millas' : 'Confirm Miles Redemption'}
            </h3>
            
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
              {recompensaSeleccionada.beneficio}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-4 mb-6 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{idioma === 'es' ? 'Millas requeridas:' : 'Required miles:'}</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                  {recompensaSeleccionada.millasRequeridas.toLocaleString('es-CO')} pts
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{idioma === 'es' ? 'Tu saldo disponible:' : 'Your available balance:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {resumen?.saldoMillas.toLocaleString('es-CO')} pts
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">{idioma === 'es' ? 'Saldo restante estimado:' : 'Estimated remaining:'}</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {Math.max((resumen?.saldoMillas || 0) - recompensaSeleccionada.millasRequeridas, 0).toLocaleString('es-CO')} pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRecompensaSeleccionada(null)}
                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                {idioma === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmarCanje}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0e3a8c] to-blue-600 text-white font-extrabold text-xs shadow-md hover:from-blue-900 hover:to-blue-700 transition-all active:scale-98"
              >
                {idioma === 'es' ? 'Confirmar Canje' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Banner Notificación de Éxito ── */}
        {mensajeCanje && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-3 animate-fadeIn shadow-sm">
            <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
            <span>{mensajeCanje}</span>
          </div>
        )}

        {/* ── Encabezado Principal ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#0e3a8c] dark:text-blue-300 text-xs font-black tracking-wider uppercase mb-2">
              <span className="material-symbols-outlined text-sm">stars</span>
              <span>Club Cootranar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#131b3e] dark:text-white tracking-tight">
              {m.titulo}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {m.subtitulo}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="inline-flex items-center gap-2 bg-[#0e3a8c] hover:bg-blue-900 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-md transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-base">airplane_ticket</span>
              <span>{idioma === 'es' ? 'Comprar Viaje y Acumular' : 'Book Trip & Earn'}</span>
            </button>
          </div>
        </div>

        {/* ── Grid Principal: Tarjeta VIP + Estadísticas Clave ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* ── Columna Izquierda: Tarjeta de Membresía Digital VIP ── */}
          <div className="lg:col-span-5 flex flex-col">
            <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br ${cardTheme.gradient} border ${cardTheme.border} text-white shadow-xl shadow-slate-900/10 flex flex-col justify-between min-h-[250px] sm:min-h-[270px]`}>
              
              {/* Efectos de brillo de fondo */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-3xl text-amber-300">loyalty</span>
                  <div>
                    <span className="text-[10px] tracking-widest font-black uppercase text-slate-300 block">
                      COOTRANAR FREQUENT TRAVELER
                    </span>
                    <span className="text-xs font-bold text-white/90">
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
                <div className={`w-12 h-9 rounded-md bg-gradient-to-br ${cardTheme.chip} p-1 shadow-inner flex items-center justify-center opacity-90`}>
                  <div className="w-full h-full border border-black/20 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                    <div className="border-r border-black/20" />
                    <div className="border-l border-black/20" />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-widest">
                    {m.saldoActual}
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {resumen?.saldoMillas.toLocaleString('es-CO')} <span className="text-base sm:text-lg font-bold opacity-80">pts</span>
                  </span>
                </div>
              </div>

              {/* Footer de la tarjeta */}
              <div className="relative z-10 pt-2 border-t border-white/10 flex items-end justify-between">
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
                    className="h-full bg-gradient-to-r from-[#0e3a8c] to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${resumen.siguienteNivel.progreso}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  {m.faltanMillas} <strong className="text-slate-800 dark:text-slate-200">{resumen.siguienteNivel.millasFaltantes.toLocaleString('es-CO')}</strong> {m.paraAlcanzar} <strong className="text-[#0e3a8c] dark:text-blue-400">{resumen.siguienteNivel.nombre}</strong>.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">workspace_premium</span>
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
                  ${resumen?.valorEquivalenteCop.toLocaleString('es-CO')} <span className="text-xs font-bold text-slate-400">COP</span>
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
                  +{resumen?.estadisticas.millasPorViajes.toLocaleString('es-CO')} {idioma === 'es' ? 'millas acumuladas en ruta' : 'miles earned in routes'}
                </p>
              </div>
            </div>

            {/* Card 3: Multiplicador del Nivel */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  Multiplicador Activo
                </span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
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

            {/* Card 4: Bono de Registro */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {m.bonos}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
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

        {/* ── SECCIÓN: CALCULADORA INTERACTIVA DE MILLAS ── */}
        <div className="bg-gradient-to-br from-blue-900 via-[#0e3a8c] to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/15">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
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
              {[25000, 45000, 70000, 110000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMontoSimulado(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    montoSimulado === val
                      ? 'bg-white text-[#0e3a8c] shadow-sm'
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
                    -${calculandoSimulador ? '...' : item.descuentoFuturoCop.toLocaleString('es-CO')} COP
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                titulo: 'Descuento $10.000 COP',
                millasRequeridas: 1000,
                beneficio: 'Cupón de descuento directo para cualquier viaje Cootranar',
                icono: 'confirmation_number',
                tag: 'Popular'
              },
              {
                titulo: 'Envío Encomienda Gratis (hasta 5kg)',
                millasRequeridas: 1500,
                beneficio: 'Envía un paquete sin costo en cualquier ruta intermunicipal',
                icono: 'package_2',
                tag: 'Encomiendas'
              },
              {
                titulo: 'Pasaje Regional Gratis',
                millasRequeridas: 2500,
                beneficio: 'Tiquete 100% gratuito para rutas de corta y mediana distancia',
                icono: 'directions_bus',
                tag: 'Viaje Gratis'
              },
              {
                titulo: '50% Descuento Ruta Larga',
                millasRequeridas: 4000,
                beneficio: 'Mitad de precio en rutas interdepartamentales e intermunicipales',
                icono: 'stars',
                tag: 'VIP'
              },
            ].map((rec, i) => {
              const puedeCanjear = (resumen?.saldoMillas || 0) >= rec.millasRequeridas;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">{rec.icono}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-[#0e3a8c] dark:text-blue-300">
                        {rec.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-[#131b3e] dark:text-white mb-1">
                      {rec.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                      {rec.beneficio}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Costo</span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {rec.millasRequeridas.toLocaleString('es-CO')} pts
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCanjear(rec)}
                      disabled={!puedeCanjear}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        puedeCanjear
                          ? 'bg-[#0e3a8c] hover:bg-blue-900 text-white shadow-xs active:scale-95 cursor-pointer'
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

        {/* ── SECCIÓN: HISTORIAL DE MOVIMIENTOS ── */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#131b3e] dark:text-white tracking-tight">
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
                      ? 'bg-[#0e3a8c] dark:bg-blue-600 text-white shadow-xs'
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
              {idioma === 'es' ? 'Conoce los 4 escalones del Club Cootranar y sus beneficios exclusivos' : 'Discover the 4 Cootranar Club tiers and their exclusive perks'}
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
                      ? 'bg-gradient-to-b from-blue-50/70 to-white dark:from-blue-950/40 dark:to-slate-800 border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-400/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-xs opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${nv.badgeBg}`}>
                        {nv.nombre}
                      </span>
                      {esNivelActual && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Tu Nivel
                        </span>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-slate-400 block font-semibold">
                        {nv.minMillas.toLocaleString('es-CO')} {nv.maxMillas === Infinity ? '+' : `- ${nv.maxMillas.toLocaleString('es-CO')}`} millas
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
