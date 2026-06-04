import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { ROUTES } from '../../../shared/constants';
import type { DatosTransaccionWompi } from '../../../infrastructure/api/wompiApi';

interface Props {
  datos: DatosTransaccionWompi;
}

/**
 * Renderiza el widget de pago de Wompi.
 * Abre automáticamente el checkout sin necesidad de botón adicional.
 * Escucha cambios en la tabla pagowompi vía Supabase Realtime para redirigir automáticamente.
 */
export function WompiCheckout({ datos }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const [scriptCargado, setScriptCargado] = useState(false);
  const [intentandoAbrir, setIntentandoAbrir] = useState(false);

  // Función para cerrar el modal de Wompi usando múltiples estrategias
  const cerrarModalWompi = () => {
    console.log('[WompiCheckout] Intentando cerrar modal de Wompi...');
    
    // Estrategia 1: Buscar y cerrar iframes de Wompi
    const iframes = document.querySelectorAll('iframe[src*="wompi"], iframe[src*="checkout"]');
    iframes.forEach((iframe) => {
      console.log('[WompiCheckout] Removiendo iframe de Wompi');
      iframe.remove();
    });
    
    // Estrategia 2: Buscar overlays/modales con clases comunes
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
        // Solo ocultar si parece ser un modal (tiene position fixed/absolute o z-index alto)
        const style = window.getComputedStyle(elemento);
        if (
          style.position === 'fixed' || 
          style.position === 'absolute' || 
          parseInt(style.zIndex) > 100
        ) {
          console.log('[WompiCheckout] Ocultando elemento modal:', selector);
          elemento.style.display = 'none';
          elemento.style.visibility = 'hidden';
          elemento.style.opacity = '0';
        }
      });
    });
    
    // Estrategia 3: Remover event listeners que puedan bloquear la navegación
    document.body.style.overflow = 'auto';
    
    console.log('[WompiCheckout] Modal de Wompi cerrado');
  };

  // Suscripción a Supabase Realtime para detectar cuando el webhook actualiza el estado del pago
  useEffect(() => {
    console.log('[WompiCheckout] Configurando suscripción Realtime para referencia:', datos.referencia);
    console.log('[WompiCheckout] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

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
          console.log('[WompiCheckout] ✅ Cambio detectado en pagowompi:', payload);
          console.log('[WompiCheckout] Payload completo:', JSON.stringify(payload, null, 2));
          
          const nuevoEstado = payload.new?.estado;
          console.log('[WompiCheckout] Nuevo estado:', nuevoEstado);
          
          if (nuevoEstado === 'APROBADO') {
            console.log('[WompiCheckout] 🎉 Pago aprobado, cerrando modal y redirigiendo...');
            
            // Cerrar modal de Wompi
            cerrarModalWompi();
            
            // Esperar un momento para que el modal se cierre completamente
            setTimeout(() => {
              console.log('[WompiCheckout] Redirigiendo a página de éxito');
              window.location.href = `${ROUTES.PAGO_RESULTADO}?status=APPROVED&reference=${datos.referencia}`;
            }, 100);
            
          } else if (nuevoEstado === 'RECHAZADO') {
            console.log('[WompiCheckout] ❌ Pago rechazado, cerrando modal y redirigiendo...');
            
            // Cerrar modal de Wompi
            cerrarModalWompi();
            
            // Esperar un momento para que el modal se cierre completamente
            setTimeout(() => {
              console.log('[WompiCheckout] Redirigiendo a página de error');
              window.location.href = `${ROUTES.PAGO_RESULTADO}?status=DECLINED&reference=${datos.referencia}`;
            }, 100);
            
          } else {
            console.log('[WompiCheckout] ⚠️ Estado no reconocido o sin cambio:', nuevoEstado);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[WompiCheckout] Estado de suscripción Realtime:', status);
        if (err) {
          console.error('[WompiCheckout] ❌ Error en suscripción Realtime:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[WompiCheckout] ✅ Suscripción Realtime activa y escuchando cambios');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[WompiCheckout] ❌ Error en el canal de Realtime');
        } else if (status === 'TIMED_OUT') {
          console.error('[WompiCheckout] ⏱️ Timeout en la suscripción Realtime');
        } else if (status === 'CLOSED') {
          console.log('[WompiCheckout] 🔒 Canal de Realtime cerrado');
        }
      });

    return () => {
      console.log('[WompiCheckout] Limpiando suscripción Realtime');
      supabase.removeChannel(channel);
    };
  }, [datos.referencia, navigate]);

  useEffect(() => {
    console.log('[WompiCheckout] Montando widget con datos:', datos);
    
    if (!formRef.current) {
      console.error('[WompiCheckout] formRef.current es null');
      return;
    }

    // Limpiar scripts previos de Wompi del documento
    const scriptsAnteriores = document.querySelectorAll('script[src*="checkout.wompi.co"]');
    console.log('[WompiCheckout] Limpiando scripts anteriores:', scriptsAnteriores.length);
    scriptsAnteriores.forEach(s => s.remove());

    // Limpiar el form
    formRef.current.innerHTML = '';
    setScriptCargado(false);
    setIntentandoAbrir(false);

    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      if (!formRef.current) return;

      // Crear el script exactamente como en el HTML que funciona
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.setAttribute('data-render', 'button');
      script.setAttribute('data-public-key', datos.publicKey);
      script.setAttribute('data-currency', datos.currency);
      script.setAttribute('data-amount-in-cents', String(datos.amountInCents));
      script.setAttribute('data-reference', datos.referencia);
      script.setAttribute('data-signature:integrity', datos.firma);
      script.setAttribute('data-redirect-url', datos.redirectUrl);

      // Pre-rellenar datos del cliente desde localStorage
      try {
        const usuarioRaw = localStorage.getItem('usuario');
        if (usuarioRaw) {
          const u = JSON.parse(usuarioRaw);
          const nombreCompleto = [u.nombre, u.apellido].filter(Boolean).join(' ');
          if (nombreCompleto) script.setAttribute('data-customer-data:full-name', nombreCompleto);
          if (u.correo)    script.setAttribute('data-customer-data:email', u.correo);
          if (u.telefono)  script.setAttribute('data-customer-data:phone-number', u.telefono);
          if (u.documento) script.setAttribute('data-customer-data:legal-id', u.documento);
          if (u.tipodocumento) script.setAttribute('data-customer-data:legal-id-type', u.tipodocumento);
          // Prefijo Colombia por defecto
          script.setAttribute('data-customer-data:phone-number-prefix', '+57');
        }
      } catch {
        // Si falla la lectura del localStorage, continuar sin pre-rellenar
      }

      console.log('[WompiCheckout] Script creado con atributos:', {
        publicKey: datos.publicKey,
        currency: datos.currency,
        amountInCents: String(datos.amountInCents),
        referencia: datos.referencia,
        firma: datos.firma,
        redirectUrl: datos.redirectUrl
      });
      
      // Verificar que los atributos se establecieron correctamente
      console.log('[WompiCheckout] Verificación de atributos en el script:');
      console.log('  data-public-key:', script.getAttribute('data-public-key'));
      console.log('  data-currency:', script.getAttribute('data-currency'));
      console.log('  data-amount-in-cents:', script.getAttribute('data-amount-in-cents'));
      console.log('  data-reference:', script.getAttribute('data-reference'));
      console.log('  data-signature:integrity:', script.getAttribute('data-signature:integrity'));
      console.log('  data-redirect-url:', script.getAttribute('data-redirect-url'));

      // Verificar que el script se cargó
      script.onload = () => {
        console.log('[WompiCheckout] Script de Wompi cargado exitosamente');
        setScriptCargado(true);
        
        // Intentar hacer clic automático en el botón de Wompi después de un pequeño delay
        setTimeout(() => {
          const wompiButton = formRef.current?.querySelector('button') as HTMLButtonElement;
          if (wompiButton) {
            console.log('[WompiCheckout] Botón de Wompi encontrado, haciendo clic automático');
            setIntentandoAbrir(true);
            
            // Escuchar errores del widget
            window.addEventListener('message', (event) => {
              if (event.data?.type === 'wompi-error' || event.data?.error) {
                console.error('[WompiCheckout] Error del widget de Wompi:', event.data);
                if (event.data?.status === 403 || event.data?.message?.includes('403')) {
                  console.error('[WompiCheckout] Error 403: Verifica que localhost esté configurado en los dominios permitidos de Wompi');
                }
              }
            });
            
            wompiButton.click();
          } else {
            console.warn('[WompiCheckout] No se encontró el botón de Wompi');
          }
        }, 500);
      };
      
      script.onerror = (error) => {
        console.error('[WompiCheckout] Error cargando script de Wompi:', error);
        console.error('[WompiCheckout] Posibles causas:');
        console.error('  1. Verifica que localhost esté en los dominios permitidos de Wompi');
        console.error('  2. Verifica tu conexión a internet');
        console.error('  3. Verifica que la clave pública sea correcta');
      };

      // Agregar al form (Wompi escanea el DOM al cargar el script)
      formRef.current.appendChild(script);
      console.log('[WompiCheckout] Script agregado al DOM');
    }, 100);

    return () => {
      // Limpiar al desmontar
      clearTimeout(timer);
      console.log('[WompiCheckout] Desmontando widget');
      document.querySelectorAll('script[src*="checkout.wompi.co"]').forEach(s => s.remove());
      if (formRef.current) formRef.current.innerHTML = '';
    };
  }, [datos.referencia]); // Re-ejecutar solo si cambia la referencia

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {!intentandoAbrir && (
        <p className="text-sm text-gray-500 text-center">
          {scriptCargado ? 'Abriendo pasarela de pago...' : 'Preparando pasarela de pago...'}
        </p>
      )}
      {/* Ocultar el botón de Wompi - se hace clic automáticamente */}
      <form ref={formRef} id="wompi-form" className="hidden" />
      {!scriptCargado && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          Cargando pasarela de pago...
        </div>
      )}
    </div>
  );
}
