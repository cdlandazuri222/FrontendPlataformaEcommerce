import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { ROUTES } from '../../../shared/constants';
import type { DatosTransaccionWompi } from '../../../infrastructure/api/wompiApi';

interface Props {
  datos: DatosTransaccionWompi;
  onCerrar?: () => void;
}

/**
 * Renderiza e invoca el Widget Checkout de Wompi mediante WidgetCheckout de JavaScript.
 * Compatible con Safari (iOS / iPhone) sin requerir desactivar el bloqueo de ventanas emergentes.
 */
export function WompiCheckout({ datos, onCerrar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const checkoutInstanciaRef = useRef<any>(null);
  const intentoInicialRef = useRef(false);

  // Función para remover overlays o modales residuales de Wompi ÚNICAMENTE al terminar o cancelar
  const limpiarModalesWompi = useCallback(() => {
    console.log('[WompiCheckout] Limpiando elementos residuales de Wompi...');

    const iframes = document.querySelectorAll('iframe[src*="wompi"], iframe[src*="checkout"]');
    iframes.forEach((iframe) => {
      iframe.remove();
    });

    const selectores = [
      '.wompi-widget',
      '#wompi-widget',
      '[class*="wompi-modal"]',
      '[class*="wompi-overlay"]'
    ];

    selectores.forEach((selector) => {
      const elementos = document.querySelectorAll(selector);
      elementos.forEach((el) => {
        (el as HTMLElement).remove();
      });
    });

    document.body.style.overflow = 'auto';
  }, []);

  // 1. Suscripción a Supabase Realtime para capturar confirmación del Webhook
  useEffect(() => {
    console.log('[WompiCheckout] Configurando suscripción Realtime para referencia:', datos.referencia);

    const channel = supabase
      .channel(`pagowompi:${datos.referencia}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pagowompi',
          filter: `referencia=eq.${datos.referencia}`
        },
        (payload) => {
          console.log('[WompiCheckout] Cambio detectado en pagowompi:', payload);
          const nuevoEstado = payload.new?.estado;

          if (nuevoEstado === 'APROBADO') {
            console.log('[WompiCheckout] Pago aprobado, cerrando y redirigiendo...');
            limpiarModalesWompi();
            setTimeout(() => {
              window.location.href = `${ROUTES.PAGO_RESULTADO}?status=APPROVED&reference=${datos.referencia}`;
            }, 100);
          } else if (nuevoEstado === 'RECHAZADO') {
            console.log('[WompiCheckout] Pago rechazado, cerrando y redirigiendo...');
            limpiarModalesWompi();
            setTimeout(() => {
              window.location.href = `${ROUTES.PAGO_RESULTADO}?status=DECLINED&reference=${datos.referencia}`;
            }, 100);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[WompiCheckout] Error en suscripción Realtime:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[WompiCheckout] Suscripción Realtime activa');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [datos.referencia, limpiarModalesWompi]);

  // 2. Instanciar y abrir WidgetCheckout
  const abrirPasarela = useCallback(() => {
    const WompiWidget = (window as any).WidgetCheckout;

    if (typeof WompiWidget !== 'function') {
      console.warn('[WompiCheckout] window.WidgetCheckout no disponible en el DOM');
      return;
    }

    // Pre-rellenar información del cliente desde localStorage si existe
    let customerData: any = undefined;
    try {
      const usuarioRaw = localStorage.getItem('usuario');
      if (usuarioRaw) {
        const u = JSON.parse(usuarioRaw);
        const fullName = [u.nombre, u.apellido].filter(Boolean).join(' ').trim();
        const data: any = {};
        if (u.correo?.trim()) data.email = u.correo.trim();
        if (fullName) data.fullName = fullName;
        if (u.telefono?.trim()) {
          data.phoneNumber = u.telefono.trim();
          data.phoneNumberPrefix = '+57';
        }
        if (u.documento?.trim()) data.legalId = u.documento.trim();
        if (u.tipodocumento?.trim()) data.legalIdType = u.tipodocumento.trim();

        if (Object.keys(data).length > 0) {
          customerData = data;
        }
      }
    } catch {
      // Ignorar error al parsear usuario
    }

    const config: any = {
      currency: datos.currency,
      amountInCents: datos.amountInCents,
      reference: datos.referencia,
      publicKey: datos.publicKey,
      signature: {
        integrity: datos.firma
      }
    };

    if (datos.redirectUrl && datos.redirectUrl.trim()) {
      config.redirectUrl = datos.redirectUrl.trim();
    }

    if (customerData) {
      config.customerData = customerData;
    }

    console.log('[WompiCheckout] Abriendo checkout con WidgetCheckout oficial para ref:', datos.referencia);
    const checkout = new WompiWidget(config);
    checkoutInstanciaRef.current = checkout;
    setAbierto(true);

    try {
      checkout.open((result: any) => {
        console.log('[WompiCheckout] Callback WidgetCheckout finalizado:', result);
      });
    } catch (err) {
      console.error('[WompiCheckout] Error al llamar checkout.open():', err);
    }
  }, [datos]);

  // 3. Intento de apertura automática una sola vez al montar
  useEffect(() => {
    if (intentoInicialRef.current) return;
    intentoInicialRef.current = true;

    let timer: NodeJS.Timeout | null = null;
    let intentos = 0;

    const intentar = () => {
      if (typeof (window as any).WidgetCheckout === 'function') {
        abrirPasarela();
      } else if (intentos < 15) {
        intentos++;
        timer = setTimeout(intentar, 150);
      }
    };

    intentar();

    return () => {
      if (timer) clearTimeout(timer);
      // ¡IMPORTANTE: NO limpiar modales en este cleanup, ya que React StrictMode o un re-render
      // destruirían el iframe de Wompi mientras el usuario está pagando!
    };
  }, [abrirPasarela]);

  const handleCancelar = () => {
    limpiarModalesWompi();
    onCerrar?.();
  };

  const montoCop = Math.round(datos.amountInCents / 100);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-5 shadow-sm text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-[#0e3a8c] dark:text-blue-400 font-bold text-base">
        <span className="material-symbols-outlined text-2xl">verified_user</span>
        <span>Pasarela de Pago Segura Wompi</span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
        Total a pagar: <strong className="font-extrabold text-slate-900 dark:text-white">{montoCop.toLocaleString('es-CO')} COP</strong>.
        {abierto
          ? ' Si la ventana de pago se cerró o tu navegador bloqueó la apertura automática, pulsa el botón a continuación:'
          : ' Abriendo la pasarela de pago segura...'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        {/* Botón con activación por toque directo del usuario — 100% compatible con Safari en iPhone */}
        <button
          type="button"
          onClick={abrirPasarela}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#0e3a8c] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">lock</span>
          {abierto ? 'Reabrir pasarela de pago' : 'Pagar ahora con Wompi'}
        </button>

        {onCerrar && (
          <button
            type="button"
            onClick={handleCancelar}
            className="w-full sm:w-auto px-4 py-3.5 bg-transparent hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-all text-xs cursor-pointer"
          >
            Cancelar / Cambiar método
          </button>
        )}
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 pt-1">
        <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">lock</span>
        <span>Transacción cifrada · Tarjetas, PSE, Nequi y Bancolombia</span>
      </div>
    </div>
  );
}
