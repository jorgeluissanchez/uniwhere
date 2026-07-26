/**
 * Fuente de la pose de la cámara AR expuesta por Viro/ARCore/ARKit.
 *
 * El modo "primera persona" del PLY necesita conocer la posición y rotación
 * del teléfono en el mundo real para sincronizar la cámara Three.js. Esta
 * interfaz abstrae el origen; hoy se implementa con Viro, mañana podría
 * implementarse con un módulo distinto o con un mock para tests.
 *
 * El callback se invoca a la frecuencia que Viro entregue (típicamente 30 Hz
 * en ARCore). No se hace throttling aquí: el consumidor decide cómo
 * muestrear.
 */

export type Vec3 = readonly [number, number, number];

export type ArCameraPose = {
  /** Posición de la cámara en el mundo, en metros. */
  position: Vec3;
  /**
   * Hacia dónde apunta la cámara, unitario y en world-space.
   *
   * Se guarda la base {forward, up} y no un cuaternión ni los ángulos de Euler
   * porque es lo único que Viro entrega sin ambigüedad. Su `rotation` son
   * ángulos de Euler en GRADOS y sin orden documentado, así que reconstruir la
   * orientación desde ahí obliga a adivinar convenciones; `forward`/`up` son
   * vectores del mundo y no dependen de ninguna.
   */
  forward: Vec3;
  /** Vector "arriba" de la cámara, unitario y en world-space. */
  up: Vec3;
  /** Yaw en radianes derivado de `forward`, proyectado al plano XZ. */
  yaw: number;
  /** Timestamp en ms del frame. */
  timestamp: number;
};

export interface ArCameraDataSource {
  /**
   * Registra un observador de la pose. Devuelve una función para cancelar la
   * suscripción. Varios observadores son válidos.
   */
  onPoseUpdate(cb: (pose: ArCameraPose) => void): () => void;
  /**
   * Snapshot de la pose más reciente, o `null` si el AR aún no está listo.
   * Útil para bridges que se montan antes del primer `onPoseUpdate`.
   */
  getLatestPose(): ArCameraPose | null;
  /**
   * Estado del tracking AR. `idle` antes de inicializar, `ready` una vez
   * Viro entrega pose, `unavailable` si el dispositivo no soporta AR.
   */
  getTrackingState(): 'idle' | 'ready' | 'unavailable';
}
