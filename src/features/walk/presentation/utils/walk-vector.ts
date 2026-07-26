/**
 * Utilidades para calcular el desplazamiento del usuario dentro del PLY a
 * partir del yaw de la cámara y la dirección del joystick.
 *
 * Tres problemas distintos se resuelven aquí:
 *  1. Forward / right unitarios en el plano horizontal (XZ) dado el yaw.
 *  2. Aplicar la magnitud del joystick normalizada (-1..1 en cada eje) a
 *     esos unitarios para obtener el vector de caminata en mundo.
 *  3. Acumular el desplazamiento al caminar (`integrate`) respetando `dt`.
 *
 * El yaw se rota alrededor del eje Y (tres ejes; ver `extractYawFromQuaternion`
 * en el data source). Por convención, yaw=0 corresponde al eje -Z (Three.js
 * forward), y un yaw positivo gira hacia +X.
 */
import * as THREE from 'three';

export type Vec2 = { x: number; z: number };

/**
 * Vector forward unitario en el plano XZ para un yaw dado.
 *
 * Convención: yaw=0 -> mirando hacia -Z (forward de Three.js). Yaw positivo
 * gira hacia -X (mano izquierda, sentido antihorario visto desde arriba).
 * Esto es la convención que produce atan2(forward.x, -forward.z) = yaw.
 */
export function forwardFromYaw(yaw: number): Vec2 {
  return {
    x: -Math.sin(yaw),
    z: -Math.cos(yaw),
  };
}

/**
 * Vector right unitario en el plano XZ para un yaw dado.
 *
 * Right es forward rotado -90° (sentido horario desde arriba). Si forward
 * es (-sin, -cos), right es (cos, -sin).
 */
export function rightFromYaw(yaw: number): Vec2 {
  return {
    x: Math.cos(yaw),
    z: -Math.sin(yaw),
  };
}

/**
 * Combina yaw + joystick en un vector de desplazamiento en mundo/segundo.
 *
 * El joystick entrega `(x, z)` con x=right/left, z=forward/back (en el
 * espacio del joystick, no del mundo). Eso se rota por el yaw para obtener
 * el vector de desplazamiento real.
 *
 * `magnitude` (la velocidad en m/s) sale afuera; esto solo devuelve la
 * dirección como vector unitario. Devuelve `null` si el input es tan
 * pequeño que no quiere moverse.
 */
export function walkDirection(yaw: number, joystick: Vec2, deadzone = 0.06): Vec2 | null {
  const mag = Math.hypot(joystick.x, joystick.z);
  if (mag < deadzone) return null;

  const forward = forwardFromYaw(yaw);
  const right = rightFromYaw(yaw);

  // El joystick está en el frame de la cámara: x right/left, z forward/back.
  // Proyectamos a world space con la base {forward, right}.
  const worldX = forward.x * joystick.z + right.x * joystick.x;
  const worldZ = forward.z * joystick.z + right.z * joystick.x;

  const len = Math.hypot(worldX, worldZ);
  if (len === 0) return null;
  return { x: worldX / len, z: worldZ / len };
}

/**
 * Integra el desplazamiento durante `dt` segundos para acumular al estado.
 * `direction` se asume unitario y `speed` en metros/segundo.
 */
export function integrate(
  position: THREE.Vector3,
  direction: Vec2,
  speed: number,
  dt: number,
  floorY: number,
): THREE.Vector3 {
  const dx = direction.x * speed * dt;
  const dz = direction.z * speed * dt;
  // El Y lo mantenemos al "suelo" del PLY: el usuario no vuela ni se
  // hunde. Si en el futuro queremos escaleras o salto, lo modelamos aparte.
  const newY = floorY;
  return new THREE.Vector3(position.x + dx, newY, position.z + dz);
}

export const WALK_SPEED_DEFAULT = 1.5;  // m/s, caminata
export const WALK_SPEED_RUN = 3.0;     // m/s, carrera
