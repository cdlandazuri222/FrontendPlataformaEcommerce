export const ROUTES = {
  LOGIN: '/login',
  REGISTRO: '/registro',
  VERIFICAR_EMAIL: '/verificar-email',
  HOME: '/home',
  MIS_VIAJES: '/mis-viajes',
  ENCOMIENDAS: '/encomiendas',
  MIS_ENCOMIENDAS: '/mis-encomiendas',
  MILLAS: '/millas',
  PERFIL: '/perfil',
  SELECCION_ASIENTOS: '/seleccion-asientos',
  RECUPERAR_PASSWORD: '/recuperar-password',
  VERIFICAR_CODIGO_PASSWORD: '/recuperar-password/verificar',
  NUEVA_PASSWORD: '/nueva-password',
  PAGO_RESULTADO: '/pago-resultado',
  FORMULARIO_PASAJEROS: '/formulario-pasajeros',
} as const;

export const ESTADOS_TIQUETE = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  USADO: 'Usado',
} as const;
