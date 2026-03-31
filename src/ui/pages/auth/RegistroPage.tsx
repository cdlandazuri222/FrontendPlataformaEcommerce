import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';
import busCootranar from '../../../assets/busCootranar.png';

const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'Pasaporte'];

export function RegistroPage() {
  const { registro, loading, error, setError } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmarPassword: '',
    tipoDocumento: 'CC',
    documento: '',
    telefono: '',
    direccion: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validarCampo = (name: string, value: string): string => {
    if (!value) return '';
    switch (name) {
      case 'correo':
        return !value.includes('@') ? 'El correo debe contener @' : '';
      case 'password': {
        const checks: string[] = [];
        if (value.length < 6 || value.length > 12) checks.push('entre 6 y 12 caracteres');
        if (!/[A-Z]/.test(value)) checks.push('1 mayúscula');
        if (!/[0-9]/.test(value)) checks.push('1 número');
        return checks.length ? `Falta: ${checks.join(', ')}` : '';
      }
      case 'confirmarPassword':
        return value !== formData.password ? 'Las contraseñas no coinciden' : '';
      case 'telefono':
        return !/^\d{7,15}$/.test(value) ? 'Teléfono inválido (solo números, 7-15 dígitos)' : '';
      case 'documento':
        return !/^\d+$/.test(value) ? 'Solo se permiten números' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: validarCampo(name, value) });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmarPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmarPassword: 'Las contraseñas no coinciden' }));
      return;
    }
    try {
      const { confirmarPassword: _, ...data } = formData;
      await registro(data);
      setSuccess(true);
    } catch {
      // error handled by useAuth
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full border border-slate-100 text-center">
          <span className="material-symbols-outlined text-6xl text-green-500 mb-4 block">mark_email_read</span>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">¡Registro exitoso!</h2>
          <p className="text-slate-500 mb-6">
            Te enviamos un correo de verificación a <span className="font-bold text-slate-700">{formData.correo}</span>. Revisa tu bandeja de entrada para activar tu cuenta.
          </p>
          <Link
            to={ROUTES.LOGIN}
            className="inline-block bg-brand-blue text-white font-bold px-8 py-3 rounded-xl hover:bg-brand-blue-light transition-colors"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start lg:items-center justify-center lg:p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="flex w-full min-h-screen lg:min-h-0 lg:h-[95vh] overflow-hidden lg:shadow-2xl bg-brand-blue lg:bg-white max-w-[1536px] lg:rounded-3xl border-0 lg:border border-slate-100 flex-col lg:flex-row">

        {/* Panel Izquierdo */}
        <div className="flex w-full h-[45vh] lg:h-auto lg:w-[45%] relative overflow-hidden bg-brand-blue order-1 lg:order-1 shrink-0">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${busCootranar})`, filter: 'brightness(0.85) contrast(1.1)' }} />
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-blue via-brand-blue/40 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col justify-end p-8 pb-8 lg:p-16 text-white w-full h-full">
            <div className="space-y-4 max-w-lg">
              <div className="w-16 h-1 bg-white/30 rounded-full mb-6" />
              <h2 className="text-3xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                Únete a<span className="text-brand-blue-light block">Cootranar.</span>
              </h2>
              <p className="text-base lg:text-lg text-blue-50 font-medium opacity-90 leading-relaxed">
                Crea tu cuenta y empieza a reservar tus viajes de forma rápida y segura.
              </p>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formulario */}
        <div className="w-full lg:w-[55%] flex flex-col bg-white lg:rounded-none rounded-t-[2.5rem] relative z-20 custom-scrollbar overflow-y-auto order-2 lg:order-2 shadow-[0_-15px_30px_rgba(0,0,0,0.15)] lg:shadow-none">
          <div className="max-w-[520px] w-full mx-auto px-6 py-8 lg:px-12 lg:py-10 flex-grow flex flex-col justify-center">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Cootranar" className="h-16 w-auto" />
            </div>
            <header className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Crear cuenta</h1>
              <p className="text-slate-500">Completa tus datos para registrarte.</p>
            </header>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre" icon="person" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Juan" error={fieldErrors.nombre} required />
                <Field label="Apellido" icon="person" name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Pérez" error={fieldErrors.apellido} required />
              </div>

              {/* Correo */}
              <Field label="Correo Electrónico" icon="mail" name="correo" type="email" value={formData.correo} onChange={handleChange} placeholder="usuario@ejemplo.com" error={fieldErrors.correo} required />

              {/* Tipo y Número de Documento */}
              <div className="grid grid-cols-[140px_1fr] gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Tipo Doc.</label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    className="w-full rounded-xl h-12 px-3 text-sm font-medium text-slate-700 transition-all"
                    style={{ border: '1px solid #e2e8f0', backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                  >
                    {TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Field label="Número de Documento" icon="badge" name="documento" value={formData.documento} onChange={handleChange} placeholder="1234567890" error={fieldErrors.documento} required />
              </div>

              {/* Teléfono y Dirección */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono" icon="phone" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="3001234567" error={fieldErrors.telefono} required />
                <Field label="Dirección" icon="home" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle 123 #45-67" error={fieldErrors.direccion} required />
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 rounded-xl h-12 transition-all placeholder:text-slate-400"
                    style={{ border: `1px solid ${fieldErrors.password ? '#f87171' : '#e2e8f0'}`, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="material-symbols-outlined absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs ml-1 text-red-600">{fieldErrors.password}</p>}
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">lock_reset</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmarPassword"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 rounded-xl h-12 transition-all placeholder:text-slate-400"
                    style={{ border: `1px solid ${fieldErrors.confirmarPassword ? '#f87171' : '#e2e8f0'}`, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="material-symbols-outlined absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {fieldErrors.confirmarPassword && <p className="text-xs ml-1 text-red-600">{fieldErrors.confirmarPassword}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold h-14 rounded-xl shadow-lg shadow-brand-blue/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] text-lg"
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </button>
                <p className="text-center text-slate-500 text-sm mt-4">
                  ¿Ya tienes cuenta? <Link to={ROUTES.LOGIN} className="text-brand-blue font-bold hover:text-brand-blue-light transition-colors">Inicia sesión</Link>
                </p>
              </div>
            </form>
          </div>

          <footer className="mt-auto border-t border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2024 Cootranar S.A. Calidad y servicio en cada viaje.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-brand-blue transition-colors">Privacidad</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Términos</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para campos de texto
function Field({
  label, icon, name, type = 'text', value, onChange, placeholder, error, required,
}: {
  label: string; icon: string; name: string; type?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; error?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full pl-12 rounded-xl h-12 transition-all placeholder:text-slate-400"
          style={{ border: `1px solid ${error ? '#f87171' : '#e2e8f0'}`, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-xs ml-1 text-red-600">{error}</p>}
    </div>
  );
}
