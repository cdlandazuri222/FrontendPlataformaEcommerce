import { useState, type FormEvent } from 'react';
import type { CompletarPerfilDTO } from '../../../infrastructure/api/wompiApi';

interface Props {
  onCompletado: (datos: CompletarPerfilDTO) => Promise<void>;
  errorExterno?: string | null;
}

const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'PP', 'NIT'];

export function FormularioCompletarPerfil({ onCompletado, errorExterno }: Props) {
  const [form, setForm] = useState<CompletarPerfilDTO>({
    nombre: '',
    apellido: '',
    tipoDocumento: 'CC',
    documento: '',
    telefono: '',
  });
  const [errores, setErrores] = useState<Partial<Record<keyof CompletarPerfilDTO, string>>>({});
  const [enviando, setEnviando] = useState(false);

  const validar = (): boolean => {
    const nuevosErrores: Partial<Record<keyof CompletarPerfilDTO, string>> = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!form.apellido.trim()) nuevosErrores.apellido = 'El apellido es requerido';
    if (!form.documento.trim()) nuevosErrores.documento = 'El documento es requerido';
    if (!form.telefono.trim()) nuevosErrores.telefono = 'El teléfono es requerido';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name as keyof CompletarPerfilDTO]) {
      setErrores(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setEnviando(true);
    try {
      await onCompletado(form);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-transparent dark:border-slate-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-1">Completa tus datos</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
          Necesitamos estos datos para generar tu tiquete correctamente.
        </p>

        {errorExterno && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {errorExterno}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Juan"
                className={`w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.nombre ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              />
              {errores.nombre && <p className="text-xs text-red-500 mt-1">{errores.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Apellido *</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="Pérez"
                className={`w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.apellido ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              />
              {errores.apellido && <p className="text-xs text-red-500 mt-1">{errores.apellido}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tipo doc.</label>
              <select
                name="tipoDocumento"
                value={form.tipoDocumento}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIPOS_DOCUMENTO.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Documento *</label>
              <input
                name="documento"
                value={form.documento}
                onChange={handleChange}
                placeholder="1234567890"
                className={`w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.documento ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              />
              {errores.documento && <p className="text-xs text-red-500 mt-1">{errores.documento}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono *</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="3001234567"
              className={`w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errores.telefono ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
            />
            {errores.telefono && <p className="text-xs text-red-500 mt-1">{errores.telefono}</p>}
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {enviando ? 'Guardando...' : 'Guardar y continuar al pago'}
          </button>
        </form>
      </div>
    </div>
  );
}
