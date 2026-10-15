/**
 * Utilidades para descarga y visualización de archivos PDF compatibles con Safari (iOS / macOS),
 * Chrome, Firefox y Android, evitando el bloqueo de ventanas emergentes (pop-ups).
 */

export function esDispositivoIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Abre o descarga un PDF superando las restricciones del bloqueador de ventanas emergentes de Safari.
 * 
 * En Safari iOS (iPhone/iPad):
 * `window.open()` tras una petición asíncrona es bloqueado silenciosamente.
 * La navegación directa (`window.location.href = url`) activa el visor nativo de iOS donde
 * el usuario puede leerlo con zoom, imprimirlo, compartirlo o pulsar "Guardar en Archivos".
 * 
 * En navegadores de escritorio:
 * Se abre la pestaña síncronamente durante el clic del usuario (`about:blank`) y luego se redirige
 * cuando la promesa de red resuelve, garantizando que el navegador no lo marque como pop-up bloqueado.
 */
export async function abrirODescargarPdf(
  obtenerUrl: () => Promise<string>,
  nombreArchivo?: string
): Promise<void> {
  const isIOS = esDispositivoIOS();

  // En escritorio abrimos la pestaña síncronamente dentro del evento de interacción del usuario
  let nuevaPestana: Window | null = null;
  if (!isIOS) {
    try {
      nuevaPestana = window.open('about:blank', '_blank');
    } catch {
      nuevaPestana = null;
    }
  }

  try {
    const url = await obtenerUrl();

    if (!url) {
      if (nuevaPestana && !nuevaPestana.closed) nuevaPestana.close();
      throw new Error('No se recibió la URL de descarga del PDF');
    }

    if (isIOS) {
      // En iOS Safari, la navegación directa nunca es bloqueada y lanza el lector nativo de PDF
      window.location.href = url;
    } else if (nuevaPestana && !nuevaPestana.closed) {
      nuevaPestana.location.href = url;
    } else {
      // Fallback si el navegador bloqueó la ventana inicial
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      if (nombreArchivo) {
        a.download = nombreArchivo;
      }
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 100);
    }
  } catch (error) {
    if (nuevaPestana && !nuevaPestana.closed) {
      nuevaPestana.close();
    }
    throw error;
  }
}
