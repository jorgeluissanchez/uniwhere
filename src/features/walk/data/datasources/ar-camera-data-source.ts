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

export type ArCameraPose = {
  /** Posición de la cámara en el mundo, en metros. */
  position: readonly [number, number, number];
  /** Cuaternión de la cámara (x, y, z, w). */
  rotation: readonly [number, number, number, number];
  /** Yaw en radianes extraído del cuaternión (para joysticks forward/right). */
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
