/**
 * Utilidad de Cifrado Asimétrico RSA-OAEP (Web Crypto API nativo)
 * Permite cifrar credenciales en el navegador antes de enviarlas por la red.
 */

const DEFAULT_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo2gHNEAuyElludH8gJ1V
eQIM0RwbEXIYM8b5BE5f6Xkxq1Z9NX/N6cAZgboyLfWChQFWUZ/+Yh+UsYrTR4ic
0Bpwnk+IS8oNqtPgqo3ClZxOxIOolSSVMhnb38oGHazF4n/BBkRbu4lOYRCyWErY
61Hu35qSrXc3faKin9SKRZQHKJZzMD2cOQ9L30cqbE59J/ZXq/oZQkPb4QsQA7tx
CwjYqMGxASXdcp9wa5YBXSa48HZw/sWWdBtRmxDTiRza5aNwbT5jnYERAVH68YVe
NM7pzBLpt2n3hRZK6g3TdEOLXBSVkbZUgxuifFln2XYSf84nj5jJKBmNDe5zJwsQ
vwIDAQAB
-----END PUBLIC KEY-----`;

let cachedCryptoKey: CryptoKey | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanPem = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');

  const binaryString = atob(cleanPem);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getRsaPublicKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  const pem = (import.meta as any).env?.VITE_RSA_PUBLIC_KEY || DEFAULT_RSA_PUBLIC_KEY;
  const spkiBuffer = pemToArrayBuffer(pem);

  cachedCryptoKey = await window.crypto.subtle.importKey(
    'spki',
    spkiBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  return cachedCryptoKey;
}

/**
 * Cifra un objeto o string utilizando RSA-OAEP / SHA-256
 * @param payload Objeto con los datos a cifrar (ej: { correo, password })
 * @returns Cadena Base64 con los datos cifrados
 */
export async function cifrarPayloadRsa(payload: Record<string, any> | string): Promise<string> {
  try {
    const key = await getRsaPublicKey();
    const dataWithTimestamp =
      typeof payload === 'object' && payload !== null
        ? JSON.stringify({ ...payload, _t: Date.now() })
        : String(payload);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(dataWithTimestamp);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      key,
      encodedData
    );

    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('Error al cifrar payload con RSA:', error);
    throw new Error('No se pudo cifrar la información de forma segura.');
  }
}

const RESPONSE_SECRET = 'cootranar_super_secure_cookie_key_2026_aes_gcm';

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

let cachedAesKey: CryptoKey | null = null;

async function getAesResponseKey(): Promise<CryptoKey> {
  if (cachedAesKey) return cachedAesKey;
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(RESPONSE_SECRET);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', secretBytes);
  cachedAesKey = await window.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedAesKey;
}

/**
 * Cifra un payload con AES-256-GCM para envío de alta seguridad al backend
 * @param data Objeto o datos a cifrar
 * @returns Cadena ivHex:ciphertextWithTagHex
 */
export async function cifrarPayloadAes(data: any): Promise<string> {
  try {
    const text = typeof data === 'object' && data !== null ? JSON.stringify(data) : String(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getAesResponseKey();
    const encoded = new TextEncoder().encode(text);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const cipherHex = Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${ivHex}:${cipherHex}`;
  } catch (error) {
    console.error('Error al cifrar payload AES:', error);
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

/**
 * Descifra datos de respuesta cifrados con AES-256-GCM
 * @param encryptedString Cadena en formato ivHex:ciphertextHex
 */
export async function descifrarRespuesta<T = any>(encryptedString: string): Promise<T> {
  if (!encryptedString || typeof encryptedString !== 'string' || !encryptedString.includes(':')) {
    return encryptedString as any;
  }
  try {
    const [ivHex, ciphertextHex] = encryptedString.split(':');
    const iv = hexToUint8Array(ivHex);
    const ciphertext = hexToUint8Array(ciphertextHex);
    const key = await getAesResponseKey();

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText as any;
    }
  } catch (error) {
    console.error('Error al descifrar respuesta segura:', error);
    return encryptedString as any;
  }
}

/**
 * Procesa automáticamente un cuerpo de respuesta JSON recibido del backend
 * Descifrando el campo `data` o `encryptedData` de forma totalmente transparente
 */
export async function descifrarDataRecursivo(body: any): Promise<any> {
  if (!body || typeof body !== 'object') return body;

  // Si data viene cifrado bajo data.encryptedData
  if (body.data && typeof body.data === 'object' && body.data.encryptedData && typeof body.data.encryptedData === 'string') {
    const decrypted = await descifrarRespuesta(body.data.encryptedData);
    return {
      ...body,
      data: decrypted,
    };
  }

  // Si data es directamente un string con formato iv:cipher
  if (body.data && typeof body.data === 'string' && body.data.includes(':')) {
    const decrypted = await descifrarRespuesta(body.data);
    return {
      ...body,
      data: decrypted,
    };
  }

  // Si encryptedData está en la raíz
  if (body.encryptedData && typeof body.encryptedData === 'string') {
    const decrypted = await descifrarRespuesta(body.encryptedData);
    if (decrypted && typeof decrypted === 'object' && !Array.isArray(decrypted)) {
      const copy = { ...body, ...decrypted };
      delete copy.encryptedData;
      return copy;
    }
    return decrypted;
  }

  return body;
}

