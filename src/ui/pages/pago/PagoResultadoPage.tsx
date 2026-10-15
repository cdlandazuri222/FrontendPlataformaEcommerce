import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { httpClient } from '../../../infrastructure/api/httpClient';
import { ROUTES } from '../../../shared/constants';
import type { TiqueteReferencia } from '../../../infrastructure/api/wompiApi';
import { abrirODescargarPdf, esDispositivoIOS } from '../../../shared/utils/descargarPdf';

/**
 * Página de resultado de pago Wompi.
 * Recibe ?status=APPROVED|DECLINED&reference=COOTRANAR-xxx
 * Muestra el diseño completo con lista de tiquetes y botón de descarga individual por cada uno.
 */
export function PagoResultadoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get('status') ?? params.get('transaction_status');
  const reference = params.get('reference');

  const esAprobado = status === 'APPROVED';
  const esRechazado = status === 'DECLINED' || status === 'VOIDED';

  const [tiquetes, setTiquetes] = useState<TiqueteReferencia[]>([]);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);
  const [descargandoTodos, setDescargandoTodos] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  // PDF puede tardar unos segundos en generarse tras el webhook
  const [intentos, setIntentos] = useState(0);

  // Obtener tiquetes a partir de la referencia (con reintentos si algún PDF aún no está listo)
  useEffect(() => {
    if (!esAprobado || !reference) return;

    const fetchTiquetes = async () => {
      try {
        const res = await httpClient.get(`/wompi/tiquetes/por-referencia/${reference}`);
        const lista: TiqueteReferencia[] = res.data.tiquetes || [];
        setTiquetes(lista);

        // Si algún tiquete aún no tiene PDF listo, reintentar hasta 5 veces cada 3s
        const todosConPdf = lista.length > 0 && lista.every((t) => t.tienePdf);
        if (!todosConPdf && intentos < 5) {
          setTimeout(() => setIntentos((i) => i + 1), 3000);
        }
      } catch {
        // Los tiquetes pueden no estar listos aún (webhook en proceso), reintentar
        if (intentos < 5) {
          setTimeout(() => setIntentos((i) => i + 1), 3000);
        }
      }
    };

    fetchTiquetes();
  }, [esAprobado, reference, intentos]);

  const handleDescargar = async (idTiquete: number, codigoTiquete?: string) => {
    setDescargandoId(idTiquete);
    setErrorDescarga(null);
    try {
      await abrirODescargarPdf(async () => {
        const res = await httpClient.get<{ success: boolean; signedUrl: string }>(
          `/wompi/tiquetes/${idTiquete}/pdf`
        );
        return res.data.signedUrl;
      }, `tiquete-${codigoTiquete || idTiquete}.pdf`);
    } catch {
      setErrorDescarga('No se pudo generar el enlace de descarga. Intenta de nuevo.');
    } finally {
      setDescargandoId(null);
    }
  };

  const handleDescargarTodos = async () => {
    setDescargandoTodos(true);
    setErrorDescarga(null);
    try {
      const urls: { url: string; codigo: string }[] = [];
      for (const t of tiquetes) {
        try {
          const res = await httpClient.get<{ success: boolean; signedUrl: string }>(
            `/wompi/tiquetes/${t.idTiquete}/pdf`
          );
          if (res.data.success && res.data.signedUrl) {
            urls.push({ url: res.data.signedUrl, codigo: t.codigoTiquete });
          }
        } catch { /* continuar */ }
      }

      if (urls.length === 0) {
        throw new Error('No hay URLs disponibles');
      }

      if (esDispositivoIOS()) {
        window.location.href = urls[0].url;
      } else {
        urls.forEach((item, index) => {
          setTimeout(() => {
            const a = document.createElement('a');
            a.href = item.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.download = `tiquete-${item.codigo}.pdf`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 100);
          }, index * 400);
        });
      }
    } catch {
      setErrorDescarga('No se pudo procesar la descarga de los tiquetes. Intenta descargarlos individualmente.');
    } finally {
      setDescargandoTodos(false);
    }
  };

  const todosConPdf = tiquetes.length > 0 && tiquetes.every((t) => t.tienePdf);

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-[Plus_Jakarta_Sans] py-8 px-6">
      <div className="max-w-[1200px] mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 flex-wrap">
          <Link to={ROUTES.HOME} className="hover:text-[#0e3a8c]">Inicio</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-bold text-[#0e3a8c]">Confirmación de Pago</span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-2xl">

            {/* Header */}
            <div className="p-8 sm:p-12 text-center border-b border-slate-100">
              {esAprobado && (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-[#111318] mb-2">¡Tu pago ha sido exitoso!</h1>
                  <p className="text-slate-500 text-lg">Gracias por confiar en Cootranar para tu viaje.</p>
                </>
              )}
              {esRechazado && (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-5xl text-red-500">cancel</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-[#111318] mb-2">Pago no procesado</h1>
                  <p className="text-slate-500 text-lg">Tu pago fue rechazado o cancelado. Los asientos han sido liberados.</p>
                </>
              )}
              {!esAprobado && !esRechazado && (
                <>
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-5xl text-yellow-500">help</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-[#111318] mb-2">Estado desconocido</h1>
                  <p className="text-slate-500 text-lg">No pudimos confirmar el estado de tu pago. Revisa tus viajes en unos minutos.</p>
                </>
              )}
            </div>

            {/* Body */}
            <div className="p-8 sm:p-12 bg-slate-50">
              {esAprobado && (
                <>
                  {/* Info de referencia */}
                  {reference && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Referencia de pago</span>
                        <span className="text-xs font-mono font-medium text-slate-700">{reference}</span>
                      </div>
                    </div>
                  )}

                  {/* Aviso de correo */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 mb-6">
                    <span className="material-symbols-outlined text-[#0e3a8c] text-xl shrink-0">info</span>
                    <p className="text-xs text-[#0e3a8c] leading-relaxed">
                      Recibirás un correo electrónico con los detalles de tu tiquete y factura electrónica en los próximos minutos.
                    </p>
                  </div>

                  {/* Estado del PDF - generando */}
                  {!todosConPdf && intentos < 5 && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 justify-center">
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      Generando tus tiquetes PDF...
                    </div>
                  )}

                  {errorDescarga && (
                    <p className="text-xs text-red-500 text-center mb-4">{errorDescarga}</p>
                  )}

                  {/* Lista de tiquetes */}
                  {tiquetes.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {tiquetes.map((tiquete) => (
                        <div
                          key={tiquete.idTiquete}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[#0e3a8c] text-xl">airline_seat_recline_normal</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#111318]">Asiento {tiquete.numeroAsiento}</p>
                              <p className="text-xs text-slate-500 font-mono truncate">{tiquete.codigoTiquete}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDescargar(tiquete.idTiquete, tiquete.codigoTiquete)}
                            disabled={descargandoId === tiquete.idTiquete || !tiquete.tienePdf}
                            className="px-4 py-2 bg-[#0e3a8c] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition-all shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {descargandoId === tiquete.idTiquete ? (
                              <>
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                <span className="hidden sm:inline">Descargando...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">download</span>
                                <span className="hidden sm:inline">{tiquete.tienePdf ? 'Descargar PDF' : 'Preparando...'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Botón descargar todos */}
                      {tiquetes.length > 1 && todosConPdf && (
                        <button
                          onClick={handleDescargarTodos}
                          disabled={descargandoTodos}
                          className="w-full px-4 py-3 bg-[#0e3a8c] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {descargandoTodos ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                              <span>Preparando descargas...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">download</span>
                              <span>Descargar todos los tiquetes ({tiquetes.length})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Botón volver al inicio */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => navigate(ROUTES.HOME)}
                  className="px-8 py-3.5 border-2 border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">home</span>
                  Volver al Inicio
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
