import type { Cliente } from '../../../domain/entities/Cliente';

interface AvatarUsuarioProps {
  usuario: Cliente;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

function getIniciales(nombre: string, apellido: string): string {
  const n = nombre?.trim()[0]?.toUpperCase() ?? '';
  const a = apellido?.trim()[0]?.toUpperCase() ?? '';
  return n + a || '?';
}

export function AvatarUsuario({ usuario, size = 'md', className = '' }: AvatarUsuarioProps) {
  const clasesTamano = sizeClasses[size];
  const tieneFotoGoogle = usuario.proveedor?.toUpperCase() === 'GOOGLE' && usuario.fotoperfil;

  if (tieneFotoGoogle) {
    return (
      <img
        src={usuario.fotoperfil}
        alt={`${usuario.nombre} ${usuario.apellido}`}
        referrerPolicy="no-referrer"
        className={`${clasesTamano} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${clasesTamano} rounded-full bg-[#0e3a8c] text-white flex items-center justify-center font-bold ring-2 ring-white select-none ${className}`}
      aria-label={`Avatar de ${usuario.nombre} ${usuario.apellido}`}
    >
      {getIniciales(usuario.nombre, usuario.apellido)}
    </div>
  );
}
