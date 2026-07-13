import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-slate-900 transition-colors duration-200" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-slate-200 dark:border-slate-700 py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 mt-8 transition-colors">
        <p>© 2024 Cootranar S.A. Calidad y servicio en cada viaje.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors">Términos</a>
          <a href="#" className="hover:text-[#0e3a8c] dark:hover:text-blue-400 transition-colors">Soporte</a>
        </div>
      </footer>
    </div>
  );
};