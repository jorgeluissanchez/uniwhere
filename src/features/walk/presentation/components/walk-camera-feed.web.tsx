/**
 * Paso de cámara para el modo sin WebXR.
 *
 * En una sesión `immersive-ar` el compositor del navegador dibuja la cámara
 * por debajo de la escena y este componente no hace falta. Sin WebXR hay que
 * montarlo a mano: un `<video>` a pantalla completa con la cámara trasera,
 * detrás del canvas transparente.
 *
 * `getUserMedia` exige contexto seguro (HTTPS o localhost) y permiso del
 * usuario; si algo de eso falta, el modo sigue siendo utilizable sobre fondo
 * negro en vez de romperse.
 */
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onError?: (message: string) => void;
};

export function WalkCameraFeed({ onError }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError?.('Este navegador no da acceso a la cámara.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // `environment` es la cámara trasera, que es la que mira a la escena.
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setActive(true);
      } catch {
        onError?.('No se pudo abrir la cámara. Revisá el permiso del navegador.');
      }
    };

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onError]);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        // Hasta que llegue el primer frame, el negro del contenedor es mejor
        // que un rectángulo blanco parpadeando.
        opacity: active ? 1 : 0,
      }}
    />
  );
}
