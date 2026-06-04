import { useEffect, useRef } from 'react';
import { supabase } from '../../infrastructure/supabase/supabaseClient';
import type { EstadoAsiento } from '../components/common/SelectorAsientos';


export function useAsientosRealtime(
  idViaje: number | null,
  asientoReservadoPropio: number | null,
  onCambio: (idasientoviaje: number, nuevoEstado: EstadoAsiento) => void,
  onReconectar?: () => void
) {
  const asientoReservadoPropioRef = useRef(asientoReservadoPropio);
  const onCambioRef = useRef(onCambio);
  const onReconectarRef = useRef(onReconectar);
  // Evitar disparar onReconectar en la suscripción inicial
  const suscritoRef = useRef(false);

  useEffect(() => { asientoReservadoPropioRef.current = asientoReservadoPropio; });
  useEffect(() => { onCambioRef.current = onCambio; });
  useEffect(() => { onReconectarRef.current = onReconectar; });

  useEffect(() => {
    if (!idViaje) return;

    suscritoRef.current = false;
    console.log(`[Realtime] Creando canal para viaje ${idViaje}`);

    const channel = supabase
      .channel(`asientos-viaje-${idViaje}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'asientoviaje', filter: `idviaje=eq.${idViaje}` },
        (payload: any) => {
          const { new: nuevo } = payload;
          if (!nuevo) return;
          const id: number = nuevo.idasientoviaje;
          const estadoBD: string = nuevo.estado;
          const estado: EstadoAsiento = estadoBD === 'RESERVADO' ? 'RESERVADO' : 'LIBRE';
          onCambioRef.current(id, estado);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tiquete', filter: `idviaje=eq.${idViaje}` },
        (payload: any) => {
          const { new: nuevo } = payload;
          if (!nuevo) return;
          const idasientoviaje: number = nuevo.idasientoviaje;
          if (idasientoviaje === asientoReservadoPropioRef.current) return;
          onCambioRef.current(idasientoviaje, 'OCUPADO');
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Canal viaje ${idViaje}: ${status}`);
        if (status === 'SUBSCRIBED') {
          if (suscritoRef.current) {
            // Reconexión real — jitter 200-800ms para distribuir requests si hay muchos usuarios
            const jitter = 200 + Math.random() * 600;
            console.log(`[Realtime] Reconexión detectada para viaje ${idViaje}, refrescando en ${Math.round(jitter)}ms`);
            setTimeout(() => onReconectarRef.current?.(), jitter);
          }
          suscritoRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          suscritoRef.current = false;
        }
      });

    return () => {
      console.log(`[Realtime] Eliminando canal para viaje ${idViaje}`);
      supabase.removeChannel(channel);
    };
  }, [idViaje]);
}
