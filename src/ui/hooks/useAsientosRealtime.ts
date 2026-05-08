import { useEffect, useRef } from 'react';
import { supabase } from '../../infrastructure/supabase/supabaseClient';
import type { EstadoAsiento } from '../components/common/SelectorAsientos';


export function useAsientosRealtime(
  idViaje: number | null,
  asientoReservadoPropio: number | null,
  onCambio: (idasientoviaje: number, nuevoEstado: EstadoAsiento) => void
) {
  const asientoReservadoPropioRef = useRef(asientoReservadoPropio);
  const onCambioRef = useRef(onCambio);

  useEffect(() => {
    asientoReservadoPropioRef.current = asientoReservadoPropio;
  });
  useEffect(() => {
    onCambioRef.current = onCambio;
  });

  useEffect(() => {
    if (!idViaje) return;

    console.log(`[Realtime] Creando canal para viaje ${idViaje}`);

    const channel = supabase
      .channel(`asientos-viaje-${idViaje}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'asientoviaje',
          filter: `idviaje=eq.${idViaje}`
        },
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tiquete',
          filter: `idviaje=eq.${idViaje}`
        },
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
      });

    return () => {
      console.log(`[Realtime] Eliminando canal para viaje ${idViaje}`);
      supabase.removeChannel(channel);
    };
  }, [idViaje]); 
}
