import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { httpClient } from '../../../infrastructure/api/httpClient';
import { ROUTES } from '../../../shared/constants';

interface DatosTiquete {
  idTiquete: number;
  codigoTiquete: string;
  tienePdf: boolean;
}

/**
 * Página de resultado de pago Wompi.
 * Recibe ?status=APPROVED|DECLINED&reference=COOTRANAR-xxx
 * Muestra el diseño completo con botón de descarga de PDF.
 */
export function PagoResultadoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get('status') ?? params.get('transaction_status');
  const reference = params.get('reference');

  const esAprobado = status === 'APPROVED';
  const esRechazado = status === 'DECLINED' || status === 'VOIDED';

  const [datosTiquete, setDatosTiquete] = useState<DatosTiquete | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  // PDF puede tardar unos segundos en generarse tras el webhook
  const [intentos, setIntentos] = useState(0);

  // Obtener idTiquete a partir de la referencia (con reintentos si el PDF aún no está listo)
  useEffect(() => {
    if (!esAprobado || !reference) return;

    const fetchTiquete = async () => {
      try {
        const res = await httpClient.get(`/wompi/tiquetes/por-referencia/${reference}`);
        if (res.data.success) {
          setDatosTiquete({
            idTiquete: res.data.idTiquete,
            codigoTiquete: res.data.codigoTiquete,
            tienePdf: res.data.tienePdf,
          });
          // Si el PDF aún no está listo, reintentar hasta 5 veces cada 3s
          if (!res.data.tienePdf && intentos < 5) {
            setTimeout(() => setIntentos((i) => i + 1), 3000);
          }
        }
      } catch {
        // El tiquete puede no estar listo aún (webhook en proceso), reintentar
        if (intentos < 5) {
          setTimeout(() => setIntentos((i) => i + 1), 3000);
        }
      }
    };

    fetchTiquete();
  }, [esAprobado, reference, intentos]);

  const handleDescargar = async () => {
    if (!datosTiquete?.idTiquete) return;
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const res = await httpClient.get(`/wompi/tiquetes/${datosTiquete.idTiquete}/pdf`);
      if (res.data.success && res.data.signedUrl) {
        // Abrir en nueva pestaña para descarga directa
        window.open(res.data.signedUrl, '_blank');
      }
    } catch {
      setErrorDescarga('No se pudo generar el enlace de descarga. Intenta de nuevo.');
    } finally {
      setDescargando(false);
    }
  };

  const pdfListo = datosTiquete?.tienePdf;

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
                  <p className="text-slate-500 text-lg">Tu pago fue rechazado o cancelado. El asiento ha sido liberado.</p>
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
                      {datosTiquete?.codigoTiquete && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-500">Código tiquete</span>
                          <span className="text-xs font-mono font-medium text-slate-700">{datosTiquete.codigoTiquete}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aviso de correo */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 mb-6">
                    <span className="material-symbols-outlined text-[#0e3a8c] text-xl shrink-0">info</span>
                    <p className="text-xs text-[#0e3a8c] leading-relaxed">
                      Recibirás un correo electrónico con los detalles de tu tiquete y factura electrónica en los próximos minutos.
                    </p>
                  </div>

                  {/* Estado del PDF */}
                  {!pdfListo && intentos < 5 && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 justify-center">
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      Generando tu tiquete PDF...
                    </div>
                  )}

                  {errorDescarga && (
                    <p className="text-xs text-red-500 text-center mb-4">{errorDescarga}</p>
                  )}
                </>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <button
                  onClick={() => navigate(ROUTES.HOME)}
                  className="order-2 sm:order-1 px-8 py-3.5 border-2 border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">home</span>
                  Volver al Inicio
                </button>

                {esAprobado && (
                  <button
                    onClick={handleDescargar}
                    disabled={descargando || !pdfListo}
                    className="order-1 sm:order-2 px-8 py-3.5 bg-[#0e3a8c] text-white rounded-lg font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {descargando ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        Descargando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">download</span>
                        {pdfListo ? 'Descargar Tiquete (PDF)' : 'Preparando PDF...'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
