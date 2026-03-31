import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f6f6f8]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-slate-200 py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-white mt-8">
        <p>© 2024 Cootranar S.A. Calidad y servicio en cada viaje.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#0e3a8c] transition-colors">Privacidad</a>
          <a href="#" className="hover:text-[#0e3a8c] transition-colors">Términos</a>
          <a href="#" className="hover:text-[#0e3a8c] transition-colors">Soporte</a>
        </div>
      </footer>
    </div>
  );
};
