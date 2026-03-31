export const ROUTES = {
  LOGIN: '/login',
  REGISTRO: '/registro',
  VERIFICAR_EMAIL: '/verificar-email',
  HOME: '/home',
  MIS_VIAJES: '/mis-viajes',
  ENCOMIENDAS: '/encomiendas',
  PERFIL: '/perfil',
  SELECCION_ASIENTOS: '/seleccion-asientos',
} as const;

export const ESTADOS_TIQUETE = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  USADO: 'Usado',
} as const;
