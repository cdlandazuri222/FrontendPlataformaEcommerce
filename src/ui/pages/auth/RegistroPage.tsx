import { Link } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants';

export function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6 text-center tracking-tight">Registro</h1>
        <p className="text-slate-500 mb-8 text-center text-lg">
          La página de registro está en construcción.
        </p>
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-slate-500 text-sm">
            ¿Ya tienes cuenta? <Link to={ROUTES.LOGIN} className="text-brand-blue font-bold hover:text-brand-blue-light transition-colors">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
