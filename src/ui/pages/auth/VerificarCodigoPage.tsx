import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';
import logo from '../../../assets/Logo.png.png';

export function VerificarCodigoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'ad***@cootranar.com';

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    // Solo toma el último digito si escriben rápido/pegan
    const digit = value.length > 1 ? value[value.length - 1] : value;
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Focus next on type
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = code.join('');
    if (finalCode.length < 6) return;

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      navigate(ROUTES.NUEVA_PASSWORD, { state: { email, code: finalCode } });
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
      
      {/* Tarjeta Principal */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[440px] px-5 sm:px-8 py-8 sm:py-10 relative z-10">
        
        <button 
          onClick={() => navigate(ROUTES.RECUPERAR_PASSWORD)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0B1E4A] transition-colors mb-8"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver al correo
        </button>

        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Cootranar" className="h-8 w-auto mix-blend-multiply" />
        </div>

        <h1 className="text-[22px] sm:text-[26px] font-bold text-slate-900 tracking-tight mb-2">
          Verificar Código
        </h1>
        <p className="text-[13px] text-slate-500 mb-8 leading-relaxed">
          Hemos enviado un código a tu correo...<br/>
          <strong className="text-[#0B1E4A] font-bold break-all">{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Inputs del Código */}
          <div className="flex justify-between gap-1 sm:gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="flex-1 h-12 sm:h-14 max-w-[48px] bg-slate-100 rounded-xl text-center text-lg sm:text-xl font-bold text-[#0B1E4A] focus:outline-none focus:ring-2 focus:ring-[#0B1E4A] focus:bg-white transition-all border border-transparent focus:border-[#0B1E4A]"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={code.some(d => d === '') || loading}
            className="w-full bg-[#0B1E4A] hover:bg-[#1a3673] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all"
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs">
          <span className="text-slate-500">¿No recibiste el código?</span>{' '}
          <button className="text-[#0B1E4A] font-bold hover:underline">Reenviar código</button>
        </div>
      </div>

      {/* Widget Flotante de Seguridad */}
      <div className="hidden lg:block absolute bottom-12 right-12 bg-white px-6 py-5 rounded-2xl shadow-xl border border-slate-100 max-w-[300px] z-20">
         <div className="flex items-start gap-4 mb-3">
           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined text-[16px] text-[#0B1E4A]">security</span>
           </div>
           <div>
             <h4 className="text-[#0B1E4A] font-bold text-[10px] tracking-widest uppercase">Seguridad Nivel 3</h4>
             <p className="text-slate-800 text-[11px] font-bold mt-0.5">Validación de Autoridad</p>
           </div>
         </div>
         <div className="h-1 w-full bg-[#0B1E4A] rounded-full mb-3"></div>
         <p className="text-[10px] text-slate-500 leading-relaxed">
           Esta verificación es obligatoria para acceder al portal de recuperación administrativa de Cootranar.
         </p>
      </div>

      {/* Footer Legal */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-[8px] font-bold tracking-[0.2em] text-slate-400 uppercase w-full flex flex-col items-center gap-3">
        <p>Administrative Authority</p>
        <div className="flex gap-4 opacity-70">
          <span>Legal</span>
          <span>Privacidad</span>
          <span>Soporte</span>
        </div>
      </div>
    </div>
  );
}
