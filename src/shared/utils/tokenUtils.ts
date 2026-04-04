/**
 * Utilidades para manejo seguro de tokens JWT en el cliente.
 * Permite decodificar el payload, verificar expiración y calcular
 * cuánto tiempo queda antes de que expire.
 */

interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * La verificación real ocurre en el backend.
 */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Padding base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

/** Retorna true si el token existe y no ha expirado. */
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  // exp está en segundos; Date.now() en ms
  return payload.exp * 1000 > Date.now();
};

/**
 * Retorna los milisegundos restantes antes de que expire el token.
 * Retorna 0 si el token es inválido o ya expiró.
 */
export const msUntilExpiry = (token: string | null): number => {
  if (!token) return 0;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
};

/** Umbral en ms antes de la expiración para disparar el refresh (5 minutos). */
export const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

/** Retorna true si el token expira dentro del umbral de refresh. */
export const shouldRefreshToken = (token: string | null): boolean => {
  const remaining = msUntilExpiry(token);
  return remaining > 0 && remaining < REFRESH_THRESHOLD_MS;
};
