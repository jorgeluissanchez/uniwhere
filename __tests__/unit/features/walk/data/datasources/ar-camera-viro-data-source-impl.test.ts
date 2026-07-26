import * as THREE from 'three';

import {
  ArCameraViroDataSourceImpl,
  quaternionFromBasis,
  yawFromForward,
} from '@/features/walk/data/datasources/ar-camera-viro-data-source-impl';

/** Pose neutra: mirando hacia -Z con la cabeza hacia +Y, como Three.js. */
const NEUTRAL = {
  position: [0, 0, 0] as const,
  forward: [0, 0, -1] as const,
  up: [0, 1, 0] as const,
};

describe('ArCameraViroDataSourceImpl', () => {
  it('arranca en idle sin pose', () => {
    const ds = new ArCameraViroDataSourceImpl();
    expect(ds.getTrackingState()).toBe('idle');
    expect(ds.getLatestPose()).toBeNull();
  });

  it('publica pose desde Viro y notifica a los observadores', () => {
    const ds = new ArCameraViroDataSourceImpl();
    const cb = jest.fn();
    const unsub = ds.onPoseUpdate(cb);

    ds.publishFromViro({ ...NEUTRAL, position: [1, 2, 3] });

    expect(cb).toHaveBeenCalledTimes(1);
    const pose = cb.mock.calls[0][0];
    expect(pose.position).toEqual([1, 2, 3]);
    expect(pose.forward).toEqual([0, 0, -1]);
    expect(pose.up).toEqual([0, 1, 0]);
    expect(typeof pose.yaw).toBe('number');
    expect(pose.timestamp).toBeGreaterThan(0);

    expect(ds.getTrackingState()).toBe('ready');
    expect(ds.getLatestPose()).toEqual(pose);

    unsub();
  });

  it('soporta múltiples observadores y desuscripción', () => {
    const ds = new ArCameraViroDataSourceImpl();
    const a = jest.fn();
    const b = jest.fn();
    const unsubA = ds.onPoseUpdate(a);
    ds.onPoseUpdate(b);

    ds.publishFromViro(NEUTRAL);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    ds.publishFromViro(NEUTRAL);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('markUnavailable cambia el estado', () => {
    const ds = new ArCameraViroDataSourceImpl();
    ds.markUnavailable();
    expect(ds.getTrackingState()).toBe('unavailable');
  });
});

describe('yawFromForward', () => {
  it('mirar hacia -Z es yaw 0', () => {
    expect(yawFromForward([0, 0, -1])).toBeCloseTo(0, 5);
  });

  it('mirar hacia -X es un cuarto de vuelta positivo', () => {
    // Convención de walk-vector: yaw positivo gira hacia -X.
    expect(yawFromForward([-1, 0, 0])).toBeCloseTo(Math.PI / 2, 5);
  });

  it('mirar hacia +Z es media vuelta', () => {
    expect(Math.abs(yawFromForward([0, 0, 1]))).toBeCloseTo(Math.PI, 5);
  });

  it('ignora la componente vertical', () => {
    // El mismo rumbo con el teléfono inclinado hacia abajo da el mismo yaw.
    expect(yawFromForward([0, -0.5, -1])).toBeCloseTo(yawFromForward([0, 0, -1]), 5);
  });

  it('devuelve 0 cuando el teléfono apunta recto al suelo', () => {
    // Sin componente horizontal el rumbo no está definido; devolver 0 evita que
    // salte con el ruido del tracking.
    expect(yawFromForward([0, -1, 0])).toBe(0);
  });
});

describe('quaternionFromBasis', () => {
  it('produce identidad para la orientación neutra de Three.js', () => {
    const q = quaternionFromBasis([0, 0, -1], [0, 1, 0], new THREE.Quaternion());
    expect(q.x).toBeCloseTo(0, 5);
    expect(q.y).toBeCloseTo(0, 5);
    expect(q.z).toBeCloseTo(0, 5);
    expect(Math.abs(q.w)).toBeCloseTo(1, 5);
  });

  it('nunca produce NaN — el bug que hacía desaparecer la escena', () => {
    const q = quaternionFromBasis([0.3, -0.2, -0.9], [0, 1, 0], new THREE.Quaternion());
    for (const component of [q.x, q.y, q.z, q.w]) {
      expect(Number.isNaN(component)).toBe(false);
    }
  });

  it('orienta la cámara según forward: -Z rotado cae sobre el forward dado', () => {
    const forward: [number, number, number] = [-1, 0, 0];
    const q = quaternionFromBasis(forward, [0, 1, 0], new THREE.Quaternion());

    const rotated = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    expect(rotated.x).toBeCloseTo(-1, 5);
    expect(rotated.y).toBeCloseTo(0, 5);
    expect(rotated.z).toBeCloseTo(0, 5);
  });

  it('conserva la orientación previa si forward es degenerado', () => {
    const previous = new THREE.Quaternion(0, 1, 0, 0);
    const q = quaternionFromBasis([0, 0, 0], [0, 1, 0], previous);
    expect(q).toBe(previous);
    expect(q.y).toBe(1);
  });
});

describe('WalkRepositoryImpl', () => {
  it('expone el data source AR', () => {
    const ds = new ArCameraViroDataSourceImpl();
    const repo = new (require('@/features/walk/data/repositories/walk-repository-impl').WalkRepositoryImpl)(ds);
    expect(repo.getArCamera()).toBe(ds);
  });
});
