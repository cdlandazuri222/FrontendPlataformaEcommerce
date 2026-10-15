import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpcionCombobox {
  id: number;
  nombre: string;
  tipo?: 'ciudad' | 'punto';
}

interface ComboboxCiudadesProps {
  /** Opciones disponibles para mostrar en el dropdown */
  opciones: OpcionCombobox[];
  /** Valor actualmente seleccionado */
  value: string;
  /** Callback cuando el usuario escribe (para filtrar externamente si se desea) */
  onInputChange?: (texto: string) => void;
  /** Callback cuando el usuario selecciona una opción */
  onSelect: (opcion: OpcionCombobox | null) => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Indica si está cargando opciones */
  loading?: boolean;
  /** Mensaje de error de validación */
  error?: string;
  /** Deshabilitar el componente */
  disabled?: boolean;
  /** Icono de Material Symbols a mostrar */
  icon?: string;
  /** Label visible encima del input */
  label?: string;
}

// ─── Normalización de texto (ignora acentos y mayúsculas) ─────────────────────

/**
 * Normaliza texto para comparación: minúsculas y sin diacríticos.
 * Evita que "Piendamo" (sin tilde) no coincida con "Piendamó" (con tilde)
 * al filtrar localmente las opciones del combobox.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComboboxCiudades({
  opciones,
  value,
  onInputChange,
  onSelect,
  placeholder = 'Buscar ciudad...',
  loading = false,
  error,
  disabled = false,
  icon = 'location_on',
  label,
}: ComboboxCiudadesProps) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. when parent clears the field)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debouncedInput = useDebounce(inputValue, 300);

  useEffect(() => {
    onInputChange?.(debouncedInput);
  }, [debouncedInput, onInputChange]);

  // Filter options locally by the current input text (ignora acentos y mayúsculas)
  const opcionesFiltradas = opciones.filter((o) =>
    normalizar(o.nombre).includes(normalizar(inputValue))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setInputValue(texto);
    setOpen(true);
    setHighlighted(-1);
    // If user clears the field, deselect
    if (texto === '') {
      onSelect(null);
    }
  };

  const handleSelect = useCallback(
    (opcion: OpcionCombobox) => {
      setInputValue(opcion.nombre);
      setOpen(false);
      setHighlighted(-1);
      onSelect(opcion);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, opcionesFiltradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && opcionesFiltradas[highlighted]) {
        handleSelect(opcionesFiltradas[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2 relative w-full">
      {label && (
        <span className="text-sm font-semibold text-[#111318] dark:text-slate-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#0e3a8c] dark:text-blue-400 text-lg">{icon}</span>
          {label}
        </span>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full bg-[#f6f6f8] dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-transparent dark:border-slate-600 rounded-lg h-12 px-4 pr-10 focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'ring-2 ring-red-400' : ''
          }`}
        />
        {/* Loading spinner or chevron */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <span className="material-symbols-outlined text-slate-400 text-base animate-spin">
              progress_activity
            </span>
          ) : (
            <span
              className={`material-symbols-outlined text-slate-400 text-base transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          )}
        </span>
      </div>

      {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}

      {/* Dropdown */}
      {open && !disabled && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {loading && (
            <li className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 text-center">Cargando...</li>
          )}
          {!loading && opcionesFiltradas.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 text-center">
              No se encontraron opciones
            </li>
          )}
          {!loading &&
            opcionesFiltradas.map((opcion, idx) => (
              <li
                key={`${opcion.tipo ?? 'ciudad'}-${opcion.id}`}
                onMouseDown={() => handleSelect(opcion)}
                onMouseEnter={() => setHighlighted(idx)}
                className={`px-4 py-2.5 cursor-pointer flex items-center gap-2 text-sm transition-colors ${
                  idx === highlighted
                    ? 'bg-[#0e3a8c]/10 dark:bg-blue-900/40 text-[#0e3a8c] dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-[#0e3a8c] dark:text-blue-400">
                  {opcion.tipo === 'punto' ? 'near_me' : 'location_city'}
                </span>
                <span>{opcion.nombre}</span>
                {opcion.tipo === 'punto' && (
                  <span className="ml-auto text-[10px] text-slate-400 uppercase font-bold">
                    Parada
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
