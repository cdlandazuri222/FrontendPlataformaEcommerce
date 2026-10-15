import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { ROUTES } from '../../../shared/constants';
import type { DatosTransaccionWompi } from '../../../infrastructure/api/wompiApi';

interface Props {
  datos: DatosTransaccionWompi;
  onCerrar?: () => void;
}

/**
 * Renderiza e invoca el Widget Checkout de Wompi mediante WidgetCheckout de JavaScript.
 * - Evita window.open() y la inyección dinámica de scripts en cada clic.
 * - Permite apertura automática y botón de activación directa compatible con Safari (iOS).
 * - Escucha cambios en pagowompi vía Supabase Realtime para redirigir tras aprobación/rechazo.
 */
export function WompiCheckout({ datos, onCerrar }: Props) {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const checkoutRef = useRef<any>(null);
  const yaIntentoAbrirRef = useRef(false);

  // Función para remover overlays o iframes residuales de Wompi al finalizar
  const cerrarModalWompi = useCallback(() => {
    console.log('[WompiCheckout] Removiendo modales residuales de Wompi...');

    const iframes = document.querySelectorAll('iframe[src*="wompi"], iframe[src*="checkout"]');
    iframes.forEach((iframe) => {
      iframe.remove();
    });

    const selectores = [
      '[class*="wompi"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[id*="wompi"]',
      '[id*="checkout"]',
      '.wompi-widget',
      '#wompi-widget'
    ];

    selectores.forEach((selector) => {
      const elementos = document.querySelectorAll(selector);
      elementos.forEach((el) => {
        const elemento = el as HTMLElement;
        const style = window.getComputedStyle(elemento);
        if (
          style.position === 'fixed' ||
          style.position === 'absolute' ||
          parseInt(style.zIndex, 10) > 100
        ) {
          elemento.style.display = 'none';
          elemento.style.visibility = 'hidden';
          elemento.style.opacity = '0';
        }
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
            console.log('[WompiCheckout] Pago aprobado, redirigiendo...');
            cerrarModalWompi();
            setTimeout(() => {
              window.location.href = `${ROUTES.PAGO_RESULTADO}?status=APPROVED&reference=${datos.referencia}`;
            }, 100);
          } else if (nuevoEstado === 'RECHAZADO') {
            console.log('[WompiCheckout] Pago rechazado, redirigiendo...');
            cerrarModalWompi();
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
  }, [datos.referencia, navigate, cerrarModalWompi]);

  // 2. Instanciar y abrir WidgetCheckout
  const abrirPasarela = useCallback(() => {
    const WompiWidget = (window as any).WidgetCheckout;

    if (typeof WompiWidget !== 'function') {
      console.warn('[WompiCheckout] window.WidgetCheckout no disponible aún en el DOM');
      return;
    }

    // Pre-rellenar información del cliente desde localStorage si existe
    let customerData: any = undefined;
    try {
      const usuarioRaw = localStorage.getItem('usuario');
      if (usuarioRaw) {
        const u = JSON.parse(usuarioRaw);
        const fullName = [u.nombre, u.apellido].filter(Boolean).join(' ');
        customerData = {
          email: u.correo || undefined,
          fullName: fullName || undefined,
          phoneNumber: u.telefono ? String(u.telefono) : undefined,
          phoneNumberPrefix: '+57',
          legalId: u.documento ? String(u.documento) : undefined,
          legalIdType: u.tipodocumento || 'CC',
        };
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
      },
      redirectUrl: datos.redirectUrl
    };

    if (customerData) {
      config.customerData = customerData;
    }

    console.log('[WompiCheckout] Abriendo checkout con WidgetCheckout oficial');
    const checkout = new WompiWidget(config);
    checkoutRef.current = checkout;
    setAbierto(true);

    try {
      checkout.open((result: any) => {
        console.log('[WompiCheckout] Callback WidgetCheckout ejecutado:', result);
        const transaction = result?.transaction;
        if (!transaction) {
          console.log('[WompiCheckout] El usuario cerró la pasarela');
          onCerrar?.();
        }
      });
    } catch (err) {
      console.error('[WompiCheckout] Error al llamar checkout.open():', err);
    }
  }, [datos, onCerrar]);

  // 3. Intento de apertura automática al montar el componente
  useEffect(() => {
    if (yaIntentoAbrirRef.current) return;
    yaIntentoAbrirRef.current = true;

    // Verificar si WidgetCheckout está listo; si no, reintentar brevemente
    const intentar = () => {
      if (typeof (window as any).WidgetCheckout === 'function') {
        abrirPasarela();
      } else {
        const timer = setTimeout(() => {
          if (typeof (window as any).WidgetCheckout === 'function') {
            abrirPasarela();
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    };

    const cleanup = intentar();
    return () => {
      cleanup?.();
      cerrarModalWompi();
    };
  }, [abrirPasarela, cerrarModalWompi]);

  // 4. Escuchar postMessage de Wompi para detectar cuando se cierra
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('wompi.co')) return;

      const data = event.data;
      const isClosed =
        data === 'close' ||
        data === 'closed' ||
        data?.event === 'closed' ||
        data?.action === 'closed' ||
        data?.type === 'closed' ||
        (typeof data === 'object' && data !== null && 'event' in data && data.event === 'closed');

      if (isClosed) {
        console.log('[WompiCheckout] Cierre detectado por postMessage');
        onCerrar?.();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onCerrar]);

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
          : ' Preparando el widget de pago seguro...'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        {/* Botón con activación por toque directo del usuario — 100% compatible con Safari en iPhone */}
        <button
          type="button"
          onClick={abrirPasarela}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#0e3a8c] hover:bg-blue-900 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">lock</span>
          {abierto ? 'Pagar con Wompi' : 'Abrir pasarela de pago'}
        </button>

        {onCerrar && (
          <button
            type="button"
            onClick={() => {
              cerrarModalWompi();
              onCerrar();
            }}
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
