import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { usePreferencias } from '../context/PreferenciasContext';

const TOUR_KEY = 'cootranar_tour_busqueda_v1';

type DriveInstance = ReturnType<typeof driver>;

/** Pasos del tour en español */
const pasosES = [
  {
    element: '#buscador-viaje',
    popover: {
      title: '🚌 ¡Bienvenido a Cootranar!',
      description:
        'Este es el buscador de viajes. Aquí podrás encontrar los mejores trayectos disponibles. Te guiaremos paso a paso.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#campo-origen',
    popover: {
      title: '📍 Ciudad de Origen',
      description:
        'Escribe o selecciona la ciudad desde donde saldrás. Puedes buscar por nombre de ciudad o municipio.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#campo-destino',
    popover: {
      title: '🎯 Ciudad de Destino',
      description:
        'Elige tu destino. Las opciones se filtran automáticamente según la ciudad de origen que seleccionaste.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#campo-fecha',
    popover: {
      title: '📅 Fecha del Viaje',
      description:
        'Selecciona la fecha en que deseas viajar. Solo se muestran fechas desde hoy en adelante.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#boton-limpiar',
    popover: {
      title: '🧹 Limpiar Filtros',
      description:
        '¿Quieres empezar de nuevo? Este botón borra todos los campos del formulario de una vez.',
      side: 'bottom' as const,
      align: 'center' as const,
    },
  },
  {
    element: '#boton-buscar',
    popover: {
      title: '🔍 Buscar Viajes',
      description:
        'Cuando hayas completado los campos, haz clic aquí para ver los viajes disponibles que coinciden con tu búsqueda.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '#filtros-avanzados',
    popover: {
      title: '⚙️ Filtros Avanzados',
      description:
        'Haz clic aquí para ver opciones adicionales: filtrar por hora de salida (Mañana / Tarde / Noche), tipo de bus (Premium / Estándar) y precio máximo.',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#lista-viajes',
    popover: {
      title: '🎉 ¡Aquí están tus viajes!',
      description:
        'Los resultados aparecen aquí. Cada tarjeta muestra origen, destino, hora de salida, tipo de bus, asientos disponibles y precio. ¡Elige el que mejor te convenga!',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
];

/** Pasos del tour en inglés */
const pasosEN = [
  {
    element: '#buscador-viaje',
    popover: {
      title: '🚌 Welcome to Cootranar!',
      description:
        "This is the trip search form. Here you'll find the best available routes. We'll guide you step by step.",
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#campo-origen',
    popover: {
      title: '📍 Origin City',
      description:
        'Type or select the city you will depart from. You can search by city or municipality name.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#campo-destino',
    popover: {
      title: '🎯 Destination City',
      description:
        'Choose your destination. Options are automatically filtered based on the origin city you selected.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#campo-fecha',
    popover: {
      title: '📅 Travel Date',
      description:
        'Select the date you wish to travel. Only dates from today onwards are available.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#boton-limpiar',
    popover: {
      title: '🧹 Clear Filters',
      description:
        'Want to start over? This button clears all form fields at once.',
      side: 'bottom' as const,
      align: 'center' as const,
    },
  },
  {
    element: '#boton-buscar',
    popover: {
      title: '🔍 Search Trips',
      description:
        'Once you have filled in the fields, click here to see the available trips matching your search.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '#filtros-avanzados',
    popover: {
      title: '⚙️ Advanced Filters',
      description:
        'Click here for additional options: filter by departure time (Morning / Afternoon / Night), bus type (Premium / Standard), and maximum price.',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#lista-viajes',
    popover: {
      title: '🎉 Here are your trips!',
      description:
        'Results appear here. Each card shows origin, destination, departure time, bus type, available seats and price. Choose the one that suits you best!',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
];

/**
 * Hook que gestiona el tour interactivo con Driver.js
 * para la sección de búsqueda de viajes en la HomePage.
 *
 * - Se lanza automáticamente la primera vez que el usuario visita la página.
 * - Expone `iniciarTour()` para lanzarlo manualmente.
 */
export function useTourBusqueda() {
  const { idioma, esDark } = usePreferencias();
  const driverRef = useRef<DriveInstance | null>(null);

  /** Crea (o recrea) la instancia del driver con el idioma y tema actuales */
  const crearDriver = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const pasos = idioma === 'es' ? pasosES : pasosEN;

    const instance = driver({
      showProgress: true,
      animate: true,
      overlayColor: esDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)',
      stagePadding: 10,
      stageRadius: 12,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: esDark ? 0.75 : 0.55,
      popoverClass: esDark ? 'driver-dark-mode' : '',
      nextBtnText: idioma === 'es' ? 'Siguiente →' : 'Next →',
      prevBtnText: idioma === 'es' ? '← Anterior' : '← Back',
      doneBtnText: idioma === 'es' ? '¡Listo! 🎉' : 'Done! 🎉',
      progressText: idioma === 'es' ? '{{current}} de {{total}}' : '{{current}} of {{total}}',
      steps: pasos,
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, 'done');
      },
    });

    driverRef.current = instance;
    return instance;
  }, [idioma, esDark]);

  /** Lanza el tour manualmente */
  const iniciarTour = useCallback(() => {
    const instance = crearDriver();
    instance.drive();
  }, [crearDriver]);

  /** Auto-launch en la primera visita */
  useEffect(() => {
    const yaMostrado = localStorage.getItem(TOUR_KEY);
    if (yaMostrado) return;

    // Pequeño delay para que el DOM esté listo
    const timer = setTimeout(() => {
      const instance = crearDriver();
      instance.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Escucha el evento del Navbar para lanzar el tour desde fuera */
  useEffect(() => {
    const handler = () => iniciarTour();
    window.addEventListener('cootranar:iniciar-tour', handler);
    return () => window.removeEventListener('cootranar:iniciar-tour', handler);
  }, [iniciarTour]);

  /** Destruir al desmontar */
  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return { iniciarTour };
}
