import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';

export function NuevaPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Requisitos interactivos
  const reqLength = password.length >= 8;
  const reqNumber = /\d/.test(password);
  const reqUpper = /[A-Z]/.test(password);
  const reqSpecial = /[^A-Za-z0-9]/.test(password);

  const isValid = reqLength && reqNumber && reqUpper && reqSpecial && password === confirmPassword && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    
    // Simulate API update password
    setTimeout(() => {
      setLoading(false);
      navigate(ROUTES.LOGIN);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar Decorativo */}
      <div className="hidden lg:flex w-[80px] bg-slate-50 border-r border-slate-200 flex-col items-center py-10 gap-8 h-screen sticky top-0">
         <span className="material-symbols-outlined text-slate-300">fingerprint</span>
         <span className="material-symbols-outlined text-slate-300">verified_user</span>
         <span className="material-symbols-outlined text-slate-300">shield</span>
      </div>

      <div className="flex-1 flex flex-col pt-8 lg:pt-12 items-center">
        
        {/* Header Logo */}
        <div className="flex flex-col text-center items-center gap-1 mb-8">
          <img src={logo} alt="Cootranar" className="h-10 w-auto mix-blend-multiply" />
          <p className="text-[8px] font-bold tracking-[0.2em] text-slate-400 mt-2">ADMINISTRATIVE AUTHORITY</p>
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[460px] px-8 py-10 relative z-10 flex flex-col border border-slate-50 mx-4">
          
          <div className="text-center mb-10">
            <h1 className="text-[24px] font-bold text-slate-900 tracking-tight mb-2">
              Nueva Contraseña
            </h1>
            <p className="text-[13px] text-slate-500">
              Crea una contraseña segura para tu cuenta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="space-y-4">
              {/* Nueva Contraseña Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">NUEVA CONTRASEÑA</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-500 text-[20px]">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-200/60 rounded-xl h-12 pl-12 pr-12 text-sm font-bold placeholder:font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1E4A] transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-slate-500 hover:text-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">CONFIRMAR CONTRASEÑA</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-3 text-slate-500 text-[20px]">lock_reset</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-200/60 rounded-xl h-12 pl-12 pr-12 text-sm font-bold placeholder:font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B1E4A] transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-3 text-slate-500 hover:text-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                   <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>

            {/* Panel de Requisitos */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[16px] text-slate-600">verified_user</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">REQUISITOS DE SEGURIDAD</span>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[11px] font-medium">
                <Requisito cumple={reqLength} texto="Mín. 8 caracteres" />
                <Requisito cumple={reqNumber} texto="Un número" />
                <Requisito cumple={reqUpper} texto="Una mayúscula" />
                <Requisito cumple={reqSpecial} texto="Carácter especial" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full bg-[#0B1E4A] hover:bg-[#1a3673] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button className="text-[12px] font-bold text-[#0B1E4A] hover:underline">
              ¿Necesitas ayuda? Contacta a soporte
            </button>
          </div>
        </div>

        {/* Footer Legal */}
        <div className="mt-auto mb-8 text-center text-[8px] font-bold tracking-[0.2em] text-slate-400 uppercase w-full flex items-center justify-center gap-6">
          <p>© 2024 COOTRANAR AUTHORITY</p>
          <p>SECURITY PROTOCOL V4.2</p>
        </div>
      </div>
    </div>
  );
}

function Requisito({ cumple, texto }: { cumple: boolean; texto: string }) {
  return (
    <div className={`flex items-center gap-2 ${cumple ? 'text-green-600' : 'text-slate-500'}`}>
      <span className="material-symbols-outlined text-[14px]">
        {cumple ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      {texto}
    </div>
  );
}
