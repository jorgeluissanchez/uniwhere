/**
 * Repositorio del modo "walk": simplemente wrappea el data source de la
 * cámara AR para exponer la suscripción de pose a la capa de presentación.
 *
 * No tiene lógica de dominio propia: la lógica vive en los hooks
 * (`use-walk-pose`, `use-walk-joystick`, `use-walk-anchoring`). Lo creamos
 * para respetar la convención del proyecto (data source → repository →
 * context/hook) y poder mockearlo en tests.
 */
import { ArCameraDataSource } from '../datasources/ar-camera-data-source';

export class WalkRepositoryImpl {
  constructor(private readonly arCamera: ArCameraDataSource) {}

  getArCamera(): ArCameraDataSource {
    return this.arCamera;
  }
}
