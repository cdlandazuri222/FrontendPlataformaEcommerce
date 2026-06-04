import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { ROUTES } from '../../../shared/constants';
import { httpClient } from '../../../infrastructure/api/httpClient';
import type { AsientoSeleccionadoInfo } from '../seleccion-asientos/SeleccionAsientosPage';

interface LocationState {
  idviaje: number;
  origen: string;
  destino: string;
  idPuntoOrigen: number;
  idPuntoDestino: number;
  fecha: string;
  hora: string;
  asientosSeleccionados: AsientoSeleccionadoInfo[];
}

export interface DatosPasajero {
  nombrePasajero: string;
  apellidoPasajero: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  correoPasajero: string;
  esComprador: boolean;
}

interface PasajeroSugerencia {
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  documento: string;
  telefono: string;
  correo: string;
}

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
];

export function FormularioPasajeros() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [pasajeros, setPasajeros] = useState<DatosPasajero[]>([]);
  const [errores, setErrores] = useState<Record<number, Record<string, string>>>({});
  const [sugerencias, setSugerencias] = useState<Record<number, PasajeroSugerencia[]>>({});
  const [sugerenciaActiva, setSugerenciaActiva] = useState<number | null>(null);
  const [buscando, setBuscando] = useState<Record<number, boolean>>({});
  const [usarMisDatos, setUsarMisDatos] = useState(false);

  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Redirect if no state
  useEffect(() => {
    if (!state?.asientosSeleccionados?.length) {
      navigate(ROUTES.SELECCION_ASIENTOS, { replace: true });
    }
  }, [state, navigate]);

  // Initialize passenger forms — all empty, comprador flag on first
  useEffect(() => {
    if (!state?.asientosSeleccionados?.length) return;

    const inicial: DatosPasajero[] = state.asientosSeleccionados.map((_, idx) => ({
      nombrePasajero: '',
      apellidoPasajero: '',
      tipoDocumento: 'CC',
      documento: '',
      telefono: '',
      correoPasajero: '',
      esComprador: idx === 0,
    }));

    setPasajeros(inicial);
  }, [state?.asientosSeleccionados]);

  // Validate a single passenger
  const validarPasajero = useCallback((datos: DatosPasajero): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!datos.nombrePasajero.trim()) errs.nombrePasajero = 'El nombre es obligatorio';
    if (!datos.apellidoPasajero.trim()) errs.apellidoPasajero = 'El apellido es obligatorio';
    if (!datos.tipoDocumento) errs.tipoDocumento = 'Selecciona un tipo de documento';
    if (!datos.documento.trim()) errs.documento = 'El documento es obligatorio';
    return errs;
  }, []);

  // Validate all and return if form is valid
  const formularioValido = useCallback((): boolean => {
    if (pasajeros.length === 0) return false;
    for (const p of pasajeros) {
      const errs = validarPasajero(p);
      if (Object.keys(errs).length > 0) return false;
    }
    return true;
  }, [pasajeros, validarPasajero]);

  // Toggle "Yo soy este pasajero" for passenger 1
  const handleToggleUsarMisDatos = (checked: boolean) => {
    setUsarMisDatos(checked);
    if (checked) {
      const usuario = localStorage.getItem('usuario');
      const datosUsuario = usuario ? JSON.parse(usuario) : null;
      if (datosUsuario) {
        setPasajeros(prev => {
          const copia = [...prev];
          copia[0] = {
            ...copia[0],
            nombrePasajero: datosUsuario.nombre || '',
            apellidoPasajero: datosUsuario.apellido || '',
            tipoDocumento: datosUsuario.tipoDocumento || 'CC',
            documento: datosUsuario.documento || '',
            telefono: datosUsuario.telefono || '',
            correoPasajero: datosUsuario.correo || '',
          };
          return copia;
        });
      }
    } else {
      setPasajeros(prev => {
        const copia = [...prev];
        copia[0] = {
          ...copia[0],
          nombrePasajero: '',
          apellidoPasajero: '',
          tipoDocumento: 'CC',
          documento: '',
          telefono: '',
          correoPasajero: '',
        };
        return copia;
      });
    }
    setErrores(prev => ({ ...prev, 0: {} }));
  };

  // Handle field change
  const handleChange = (index: number, campo: keyof DatosPasajero, valor: string) => {
    setPasajeros(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });

    // Clear error for this field
    setErrores(prev => {
      const copia = { ...prev };
      if (copia[index]) {
        const { [campo]: _, ...rest } = copia[index];
        copia[index] = rest;
      }
      return copia;
    });

    // Autocomplete trigger for non-comprador documento field
    if (campo === 'documento' && !pasajeros[index]?.esComprador) {
      buscarPasajeroDebounced(index, valor);
    }
  };

  // Debounced search for passenger autocomplete
  const buscarPasajeroDebounced = (index: number, documento: string) => {
    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }

    if (documento.length < 4) {
      setSugerencias(prev => ({ ...prev, [index]: [] }));
      setSugerenciaActiva(null);
      return;
    }

    debounceTimers.current[index] = setTimeout(async () => {
      setBuscando(prev => ({ ...prev, [index]: true }));
      try {
        const res = await httpClient.get<{ pasajeros: PasajeroSugerencia[] }>(
          '/wompi/pasajeros/buscar',
          { params: { documento } }
        );
        setSugerencias(prev => ({ ...prev, [index]: res.data.pasajeros || [] }));
        setSugerenciaActiva(index);
      } catch {
        setSugerencias(prev => ({ ...prev, [index]: [] }));
      } finally {
        setBuscando(prev => ({ ...prev, [index]: false }));
      }
    }, 400);
  };

  // Select a suggestion
  const seleccionarSugerencia = (index: number, sugerencia: PasajeroSugerencia) => {
    setPasajeros(prev => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        nombrePasajero: sugerencia.nombre,
        apellidoPasajero: sugerencia.apellido,
        tipoDocumento: sugerencia.tipoDocumento || 'CC',
        documento: sugerencia.documento,
        telefono: sugerencia.telefono || '',
        correoPasajero: sugerencia.correo || '',
      };
      return copia;
    });
    setSugerencias(prev => ({ ...prev, [index]: [] }));
    setSugerenciaActiva(null);
    // Clear errors for this passenger
    setErrores(prev => ({ ...prev, [index]: {} }));
  };

  // Handle blur — validate field
  const handleBlur = (index: number) => {
    const errs = validarPasajero(pasajeros[index]);
    setErrores(prev => ({ ...prev, [index]: errs }));
  };

  // Close suggestions when clicking outside
  const handleCloseSugerencias = () => {
    setSugerenciaActiva(null);
  };

  // Handle confirm
  const handleConfirmar = () => {
    // Validate all
    const nuevosErrores: Record<number, Record<string, string>> = {};
    let hayErrores = false;
    pasajeros.forEach((p, idx) => {
      const errs = validarPasajero(p);
      if (Object.keys(errs).length > 0) {
        nuevosErrores[idx] = errs;
        hayErrores = true;
      }
    });
    setErrores(nuevosErrores);

    if (hayErrores) return;

    // Navigate to payment with passenger data
    navigate(ROUTES.PAGO_RESULTADO, {
      replace: false,
      state: {
        ...state,
        pasajeros,
      },
    });
  };

  if (!state?.asientosSeleccionados?.length) return null;

  const precioTotal = state.asientosSeleccionados.reduce((sum, a) => sum + a.precio, 0);

  return (
    <div className="min-h-screen bg-[#f6f6f8]" onClick={handleCloseSugerencias}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <button onClick={() => navigate(ROUTES.HOME)} className="hover:text-[#0e3a8c] transition-colors">Inicio</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => navigate(-1)} className="hover:text-[#0e3a8c] transition-colors">Asientos</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-[#0e3a8c] font-semibold">Datos de Pasajeros</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-32 md:pb-12">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Datos de Pasajeros</h1>
              <p className="text-sm text-slate-500 mt-1">
                {state.origen} → {state.destino} · {state.fecha} · {state.hora}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{state.asientosSeleccionados.length} asiento{state.asientosSeleccionados.length > 1 ? 's' : ''}</p>
              <p className="text-lg font-extrabold text-[#0e3a8c]">{precioTotal.toLocaleString('es-CO')} COP</p>
            </div>
          </div>
        </div>

        {/* Passenger forms */}
        <div className="space-y-5">
          {pasajeros.map((pasajero, idx) => (
            <PasajeroForm
              key={idx}
              index={idx}
              asiento={state.asientosSeleccionados[idx]}
              datos={pasajero}
              errores={errores[idx] || {}}
              sugerencias={sugerenciaActiva === idx ? (sugerencias[idx] || []) : []}
              buscando={buscando[idx] || false}
              usarMisDatos={idx === 0 ? usarMisDatos : undefined}
              onToggleUsarMisDatos={idx === 0 ? handleToggleUsarMisDatos : undefined}
              onChange={handleChange}
              onBlur={handleBlur}
              onSeleccionarSugerencia={seleccionarSugerencia}
            />
          ))}
        </div>

        {/* Confirm button */}
        <div className="mt-6">
          <button
            onClick={handleConfirmar}
            disabled={!formularioValido()}
            className="w-full flex items-center justify-center gap-2 bg-[#0e3a8c] text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">payment</span>
            Confirmar y Pagar — {precioTotal.toLocaleString('es-CO')} COP
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Sub-component: Individual passenger form ─────────────────────────────────

interface PasajeroFormProps {
  index: number;
  asiento: AsientoSeleccionadoInfo;
  datos: DatosPasajero;
  errores: Record<string, string>;
  sugerencias: PasajeroSugerencia[];
  buscando: boolean;
  usarMisDatos?: boolean;
  onToggleUsarMisDatos?: (checked: boolean) => void;
  onChange: (index: number, campo: keyof DatosPasajero, valor: string) => void;
  onBlur: (index: number) => void;
  onSeleccionarSugerencia: (index: number, sugerencia: PasajeroSugerencia) => void;
}

function PasajeroForm({ index, asiento, datos, errores, sugerencias, buscando, usarMisDatos, onToggleUsarMisDatos, onChange, onBlur, onSeleccionarSugerencia }: PasajeroFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
      {/* Form header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0e3a8c] text-white rounded-xl flex items-center justify-center font-bold text-sm">
            {asiento.numeroasiento}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Pasajero {index + 1}
              {datos.esComprador && (
                <span className="ml-2 text-xs bg-blue-100 text-[#0e3a8c] px-2 py-0.5 rounded-full font-semibold">
                  Comprador
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400">
              Asiento #{asiento.numeroasiento} · {asiento.precio.toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>
      </div>

      {/* Toggle "Yo soy este pasajero" — only for passenger 1 */}
      {index === 0 && onToggleUsarMisDatos && (
        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={usarMisDatos || false}
            onChange={(e) => onToggleUsarMisDatos(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#0e3a8c] focus:ring-[#0e3a8c]"
          />
          <span className="text-sm text-slate-600">Yo soy este pasajero</span>
        </label>
      )}

      <div className="h-px bg-slate-100 mb-4" />

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoTexto
          label="Nombre *"
          value={datos.nombrePasajero}
          error={errores.nombrePasajero}
          placeholder="Nombre del pasajero"
          onChange={(v) => onChange(index, 'nombrePasajero', v)}
          onBlur={() => onBlur(index)}
        />
        <CampoTexto
          label="Apellido *"
          value={datos.apellidoPasajero}
          error={errores.apellidoPasajero}
          placeholder="Apellido del pasajero"
          onChange={(v) => onChange(index, 'apellidoPasajero', v)}
          onBlur={() => onBlur(index)}
        />
        <CampoSelect
          label="Tipo Documento *"
          value={datos.tipoDocumento}
          error={errores.tipoDocumento}
          options={TIPOS_DOCUMENTO}
          onChange={(v) => onChange(index, 'tipoDocumento', v)}
          onBlur={() => onBlur(index)}
        />
        <div className="relative">
          <CampoTexto
            label="Documento *"
            value={datos.documento}
            error={errores.documento}
            placeholder="Número de documento"
            onChange={(v) => onChange(index, 'documento', v)}
            onBlur={() => onBlur(index)}
          />
          {/* Autocomplete dropdown */}
          {!datos.esComprador && sugerencias.length > 0 && (
            <div
              className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                  onClick={() => onSeleccionarSugerencia(index, s)}
                >
                  <p className="text-sm font-medium text-slate-700">{s.nombre} {s.apellido}</p>
                  <p className="text-xs text-slate-400">{s.tipoDocumento} {s.documento}</p>
                </button>
              ))}
            </div>
          )}
          {!datos.esComprador && buscando && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Buscando...
              </p>
            </div>
          )}
        </div>
        <CampoTexto
          label="Teléfono"
          value={datos.telefono}
          placeholder="Teléfono (opcional)"
          onChange={(v) => onChange(index, 'telefono', v)}
          onBlur={() => onBlur(index)}
        />
        <CampoTexto
          label="Correo"
          value={datos.correoPasajero}
          placeholder="Correo electrónico (opcional)"
          onChange={(v) => onChange(index, 'correoPasajero', v)}
          onBlur={() => onBlur(index)}
        />
      </div>
    </div>
  );
}

// ─── Reusable field components ────────────────────────────────────────────────

function CampoTexto({ label, value, error, placeholder, onChange, onBlur }: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full bg-[#f0f2f5] rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none transition-all focus:ring-2 focus:ring-[#0e3a8c]/20 focus:bg-white ${
          error ? 'ring-2 ring-red-300 bg-red-50' : ''
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function CampoSelect({ label, value, error, options, onChange, onBlur }: {
  label: string;
  value: string;
  error?: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full bg-[#f0f2f5] rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none transition-all focus:ring-2 focus:ring-[#0e3a8c]/20 focus:bg-white appearance-none ${
          error ? 'ring-2 ring-red-300 bg-red-50' : ''
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
