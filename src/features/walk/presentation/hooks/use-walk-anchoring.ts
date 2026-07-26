/**
 * Estado del anchoring del PLY al plano AR detectado por Viro.
 *
 * Viro detecta plano automáticamente y emite `onAnchorFound` /
 * `onAnchorUpdated`. Pero el "anclar" definitivo lo dispara el usuario con
 * un botón ("Anclar"), porque a veces Viro detecta tres planos a la vez y
 * no queremos pegarnos al primero.
 *
 * El estado `anchored` controla cuándo se empieza a renderizar el PLY y
 * cuándo el `useFrame` aplica la pose AR.
 */
import { useState } from "react";

export type AnchoringState = 'idle' | 'detected' | 'anchored';

export function useWalkAnchoring() {
  const [state, setState] = useState<AnchoringState>('idle');
  return {
    state,
    markDetected: () => setState('detected'),
    anchor: () => setState('anchored'),
    reset: () => setState('idle'),
  };
}
