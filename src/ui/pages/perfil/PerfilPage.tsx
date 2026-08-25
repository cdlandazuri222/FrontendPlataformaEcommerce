import { useRef, useState } from 'react';
import heic2any from 'heic2any';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePreferencias } from '../../context/PreferenciasContext';
import { Navbar } from '../../components/layout/Navbar';
import { FOTO_PERFIL_LOCAL_KEY } from '../../components/common/AvatarUsuario';
import { ROUTES } from '../../../shared/constants';
import type { Idioma } from '../../../shared/i18n/translations';
import { httpClient } from '../../../infrastructure/api/httpClient';
import type { Cliente } from '../../../domain/entities/Cliente';

type TabAjustes = 'perfil' | 'seguridad' | 'preferencias' | 'notificaciones';

export function PerfilPage() {
  const navigate = useNavigate();
  const { getUsuario, logout } = useAuth();
  const { esDark, toggleTema, idioma, setIdioma, tx } = usePreferencias();
  const [usuario, setUsuario] = useState<Cliente | null>(() => getUsuario());
  const p = tx.perfil;

  // Pestaña activa
  const [tabActiva, setTabActiva] = useState<TabAjustes>('perfil');

  // Estado del formulario
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [apellido, setApellido] = useState(usuario?.apellido ?? '');
  const [correo] = useState(usuario?.correo ?? '');
  const [documento, setDocumento] = useState(usuario?.documento ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [direccion, setDireccion] = useState(usuario?.direccion ?? '');

  // Estados de retroalimentación
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados de foto de perfil
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    localStorage.getItem(FOTO_PERFIL_LOCAL_KEY)
  );
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [verFotoCompleta, setVerFotoCompleta] = useState(false);

  const fotoActual = fotoPreview || usuario?.fotoperfil || null;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const abrirSelectorFoto = () => {
    fileInputRef.current?.click();
  };

  const eliminarFoto = () => {
    if (confirm(idioma === 'es' ? '¿Deseas eliminar tu foto de perfil?' : 'Do you want to remove your profile photo?')) {
      localStorage.removeItem(FOTO_PERFIL_LOCAL_KEY);
      setFotoPreview(null);
      if (usuario) {
        const u = { ...usuario, fotoperfil: undefined };
        setUsuario(u);
        localStorage.setItem('usuario', JSON.stringify(u));
      }
    }
  };

  const esHeic = (archivo: File): boolean => {
    if (archivo.type === 'image/heic' || archivo.type === 'image/heif') return true;
    const n = archivo.name.toLowerCase();
    return n.endsWith('.heic') || n.endsWith('.heif');
  };

  const convertirHeicAJpeg = async (archivo: File): Promise<File> => {
    const blob = await heic2any({ blob: archivo, toType: 'image/jpeg', quality: 0.92 });
    const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
    const nombreJpeg = archivo.name.replace(/\.hei[cf]$/i, '.jpg');
    return new File([jpegBlob], nombreJpeg, { type: 'image/jpeg' });
  };

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let archivo = e.target.files?.[0];
    if (!archivo) return;

    if (esHeic(archivo)) {
      setSubiendoFoto(true);
      try {
        archivo = await convertirHeicAJpeg(archivo);
      } catch (convErr) {
        console.error('Error al convertir HEIC:', convErr);
        alert('No se pudo convertir la imagen HEIC. Por favor selecciona formato JPG, PNG o WEBP.');
        setSubiendoFoto(false);
        e.target.value = '';
        return;
      }
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('Por favor selecciona una imagen válida (JPG, PNG o WEBP).');
      e.target.value = '';
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5 MB.');
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(archivo);
    setFotoPreview(previewUrl);
    setSubiendoFoto(true);

    try {
      const formData = new FormData();
      formData.append('foto', archivo);

      const response = await httpClient.put<{
        success: boolean;
        message: string;
        data: { urlFoto: string };
      }>('/usuarios/foto-perfil', formData, {
        headers: { 'Content-Type': undefined },
      });

      if (response.data?.success && response.data?.data?.urlFoto) {
        const urlFoto = response.data.data.urlFoto;
        const storedUser = localStorage.getItem('usuario');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as Cliente;
          parsedUser.fotoperfil = urlFoto;
          localStorage.setItem('usuario', JSON.stringify(parsedUser));
          setUsuario(parsedUser);
        }
        localStorage.removeItem(FOTO_PERFIL_LOCAL_KEY);
        setFotoPreview(null);
        setMensajeExito(idioma === 'es' ? 'Foto de perfil actualizada con éxito.' : 'Profile photo updated successfully.');
        setTimeout(() => setMensajeExito(''), 4000);
      } else {
        throw new Error('No se recibió la URL de la foto');
      }
    } catch (err) {
      console.error('Error al subir foto de perfil:', err);
      setFotoPreview(null);
      alert('Hubo un error al subir la foto de perfil. Por favor intenta de nuevo.');
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  };

  const handleGuardarCambios = (ev: React.FormEvent) => {
    ev.preventDefault();
    setGuardando(true);
    setMensajeExito('');

    // Actualizar almacenamiento local
    if (usuario) {
      const usuarioActualizado: Cliente = {
        ...usuario,
        nombre,
        apellido,
        documento,
        telefono,
        direccion,
      };
      setUsuario(usuarioActualizado);
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    }

    setTimeout(() => {
      setGuardando(false);
      setMensajeExito(idioma === 'es' ? 'Cambios guardados correctamente.' : 'Changes saved successfully.');
      setTimeout(() => setMensajeExito(''), 4000);
    }, 600);
  };

  if (!usuario) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  const iniciales = `${(usuario.nombre?.[0] || 'U').toUpperCase()}${(usuario.apellido?.[0] || '').toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#f8fafd] dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      {/* Input oculto para carga de fotos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,image/heic,image/heif"
        className="hidden"
        onChange={handleArchivoSeleccionado}
        aria-label="Seleccionar foto de perfil"
      />

      {/* ── Modal Lightbox Foto Completa ── */}
      {verFotoCompleta && fotoActual && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setVerFotoCompleta(false)}
        >
          <button
            onClick={() => setVerFotoCompleta(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <img
            src={fotoActual}
            alt={`${usuario.nombre} ${usuario.apellido}`}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 sm:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* ── Columna Izquierda: Menú de Ajustes ── */}
          <aside className="md:col-span-4 lg:col-span-3 space-y-2">
            <h2 className="text-xl font-black text-[#131b3e] dark:text-slate-100 tracking-tight px-3 mb-4">
              {idioma === 'es' ? 'Ajustes' : 'Settings'}
            </h2>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setTabActiva('perfil')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2.5 ${
                  tabActiva === 'perfil'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 font-black shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">person</span>
                <span>{idioma === 'es' ? 'Perfil público' : 'Public Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTabActiva('seguridad')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  tabActiva === 'seguridad'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 font-black shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">shield</span>
                <span>{idioma === 'es' ? 'Seguridad & Cuenta' : 'Security & Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTabActiva('preferencias')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  tabActiva === 'preferencias'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 font-black shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">tune</span>
                <span>{idioma === 'es' ? 'Permisos & Preferencias' : 'Role & Preferences'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTabActiva('notificaciones')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${
                  tabActiva === 'notificaciones'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0e3a8c] dark:text-blue-400 font-black shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                <span>{idioma === 'es' ? 'Notificaciones' : 'Notifications'}</span>
              </button>
            </nav>

            <div className="pt-6 px-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>{p.cerrarSesion}</span>
              </button>
            </div>
          </aside>

          {/* ── Columna Derecha: Contenido Principal ── */}
          <section className="md:col-span-8 lg:col-span-9 bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/70 shadow-xs transition-colors">

            {mensajeExito && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                <span>{mensajeExito}</span>
              </div>
            )}

            {/* TAB 1: PERFIL PÚBLICO */}
            {tabActiva === 'perfil' && (
              <div>
                <h3 className="text-xl font-black text-[#131b3e] dark:text-slate-100 tracking-tight mb-6">
                  {idioma === 'es' ? 'Perfil público' : 'Public profile'}
                </h3>

                {/* Sección de Foto */}
                <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100 dark:border-slate-700/60">
                  <div className="relative group cursor-pointer" onClick={() => fotoActual && setVerFotoCompleta(true)}>
                    {fotoActual ? (
                      <img
                        src={fotoActual}
                        alt="Foto de perfil"
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#0e3a8c] to-[#1a4ea8] text-white flex items-center justify-center font-black text-xl shadow-sm ring-2 ring-slate-200 dark:ring-slate-700">
                        {iniciales}
                      </div>
                    )}
                    {subiendoFoto && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg animate-spin">progress_activity</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <button
                      type="button"
                      onClick={abrirSelectorFoto}
                      disabled={subiendoFoto}
                      className="bg-[#131b3e] dark:bg-blue-600 hover:bg-[#0b102b] dark:hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      <span>{idioma === 'es' ? 'Cambiar foto' : 'Change photo'}</span>
                    </button>

                    {fotoActual && (
                      <button
                        type="button"
                        onClick={eliminarFoto}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-colors text-center"
                      >
                        {idioma === 'es' ? 'Eliminar foto' : 'Remove photo'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Formulario con únicamente los datos requeridos */}
                <form onSubmit={handleGuardarCambios} className="space-y-5">
                  {/* Fila 1: Nombre y Apellido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        {p.nombre}
                      </label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        {p.apellido}
                      </label>
                      <input
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Fila 2: Correo Electrónico */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                      {p.correo}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                        mail
                      </span>
                      <input
                        type="email"
                        value={correo}
                        readOnly
                        className="w-full bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium outline-none cursor-not-allowed shadow-2xs opacity-90"
                      />
                    </div>
                  </div>

                  {/* Fila 3: Teléfono y Documento de Identidad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        {p.telefono}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                          phone_android
                        </span>
                        <input
                          type="tel"
                          value={telefono}
                          placeholder="Ej. 3186025827"
                          onChange={(e) => setTelefono(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                        {p.documento}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                          badge
                        </span>
                        <input
                          type="text"
                          value={documento}
                          placeholder="Ej. 1193051337"
                          onChange={(e) => setDocumento(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fila 4: Dirección de Residencia */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block uppercase tracking-wider">
                      {p.direccion}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                        location_on
                      </span>
                      <input
                        type="text"
                        value={direccion}
                        placeholder={idioma === 'es' ? 'Ej. Calle 18 # 24-50, Pasto' : 'Address'}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#0e3a8c] dark:focus:ring-blue-400 outline-none transition-all shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Nota de privacidad */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 pt-1">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>{idioma === 'es' ? 'Tus datos están protegidos bajo nuestra política de privacidad' : 'Your data is protected under our privacy policy'}</span>
                  </div>

                  {/* Botón Guardar Cambios */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={guardando}
                      className="bg-[#131b3e] dark:bg-blue-600 hover:bg-[#0b102b] dark:hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-slate-900/15 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>{guardando ? (idioma === 'es' ? 'Guardando...' : 'Saving...') : (idioma === 'es' ? 'Guardar cambios' : 'Save changes')}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SEGURIDAD & CUENTA */}
            {tabActiva === 'seguridad' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-[#131b3e] dark:text-slate-100 tracking-tight mb-1">
                    {idioma === 'es' ? 'Seguridad & Cuenta' : 'Security & Account'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {idioma === 'es' ? 'Gestiona el acceso y autenticación de tu cuenta' : 'Manage your account authentication'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {idioma === 'es' ? 'Método de inicio de sesión' : 'Login method'}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {usuario.proveedor?.toUpperCase() === 'GOOGLE'
                          ? 'Autenticado mediante Google OAuth'
                          : 'Autenticado mediante correo y contraseña'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-[#0e3a8c] dark:text-blue-400 rounded-full text-xs font-bold">
                      {usuario.proveedor || 'EMAIL'}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {idioma === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder={idioma === 'es' ? 'Contraseña actual' : 'Current password'}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <input
                      type="password"
                      placeholder={idioma === 'es' ? 'Nueva contraseña' : 'New password'}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(idioma === 'es' ? 'Función de cambio de contraseña enviada a tu correo.' : 'Password reset link sent to your email.')}
                    className="bg-[#131b3e] dark:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0b102b]"
                  >
                    {idioma === 'es' ? 'Actualizar contraseña' : 'Update password'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PREFERENCIAS & TEMA */}
            {tabActiva === 'preferencias' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-[#131b3e] dark:text-slate-100 tracking-tight mb-1">
                    {idioma === 'es' ? 'Permisos & Preferencias' : 'Role & Preferences'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {idioma === 'es' ? 'Personaliza el tema y el idioma de la plataforma' : 'Customize theme and language'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <span className="material-symbols-outlined">{esDark ? 'dark_mode' : 'light_mode'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.apariencia}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{esDark ? p.modoDark : p.modoLight}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTema}
                    role="switch"
                    aria-checked={esDark}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
                      esDark ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                        esDark ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <span className="material-symbols-outlined">language</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.idioma}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{idioma === 'es' ? p.espanol : p.ingles}</p>
                    </div>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                    {(['es', 'en'] as Idioma[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setIdioma(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          idioma === lang
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICACIONES */}
            {tabActiva === 'notificaciones' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-[#131b3e] dark:text-slate-100 tracking-tight mb-1">
                    {idioma === 'es' ? 'Notificaciones' : 'Notifications'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {idioma === 'es' ? 'Elige cómo quieres recibir avisos de viajes y encomiendas' : 'Choose notification channels'}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Confirmación de pasajes y tiquetes', desc: 'Recibir PDF y detalles de viaje por correo' },
                    { title: 'Estado de encomiendas en tiempo real', desc: 'Avisos cuando tu paquete cambie de estado' },
                    { title: 'Promociones y novedades', desc: 'Descuentos exclusivos en rutas Cootranar' },
                  ].map((notif, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{notif.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#0e3a8c] rounded cursor-pointer" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}
