import {
  forwardFromYaw,
  rightFromYaw,
  walkDirection,
  integrate,
} from '@/features/walk/presentation/utils/walk-vector';
import * as THREE from 'three';
describe('walk-vector', () => {
  describe('forwardFromYaw', () => {
    it('apunta a -Z con yaw=0', () => {
      const f = forwardFromYaw(0);
      expect(f.x).toBeCloseTo(0);
      expect(f.z).toBeCloseTo(-1);
    });

    it('gira hacia -X con yaw = PI/2', () => {
      const f = forwardFromYaw(Math.PI / 2);
      expect(f.x).toBeCloseTo(-1);
      expect(f.z).toBeCloseTo(0);
    });

    it('es unitario para cualquier yaw', () => {
      for (const yaw of [0, 0.3, 1.1, 2.0, -1.5, Math.PI * 1.5]) {
        const f = forwardFromYaw(yaw);
        expect(Math.hypot(f.x, f.z)).toBeCloseTo(1, 5);
      }
    });
  });

  describe('rightFromYaw', () => {
    it('ortogonal a forward', () => {
      for (const yaw of [0, 0.4, 1.2, Math.PI]) {
        const f = forwardFromYaw(yaw);
        const r = rightFromYaw(yaw);
        expect(f.x * r.x + f.z * r.z).toBeCloseTo(0, 5);
      }
    });

    it('apunta a +X con yaw=0', () => {
      const r = rightFromYaw(0);
      expect(r.x).toBeCloseTo(1);
      expect(r.z).toBeCloseTo(0);
    });
  });

  describe('walkDirection', () => {
    it('devuelve null cuando el joystick está en el deadzone', () => {
      expect(walkDirection(0, { x: 0.02, z: 0.01 })).toBeNull();
    });

    it('empuja hacia el yaw con joystick recto', () => {
      // yaw=0 -> forward = -Z. Joystick hacia adelante (z=1) -> debe ir a -Z.
      const dir = walkDirection(0, { x: 0, z: 1 });
      expect(dir).not.toBeNull();
      expect(dir!.x).toBeCloseTo(0);
      expect(dir!.z).toBeCloseTo(-1);
    });

    it('gira con la cámara', () => {
      // yaw=PI/2 -> forward = -X. Joystick hacia adelante (z=1) -> debe ir a -X.
      const dir = walkDirection(Math.PI / 2, { x: 0, z: 1 });
      expect(dir).not.toBeNull();
      expect(dir!.x).toBeCloseTo(-1);
      expect(dir!.z).toBeCloseTo(0);
    });

    it('strafe derecho con yaw=0 va a +X', () => {
      const dir = walkDirection(0, { x: 1, z: 0 });
      expect(dir).not.toBeNull();
      expect(dir!.x).toBeCloseTo(1);
      expect(dir!.z).toBeCloseTo(0);
    });

    it('devuelve vector unitario', () => {
      const dir = walkDirection(0.5, { x: 0.4, z: 0.7 });
      expect(dir).not.toBeNull();
      expect(Math.hypot(dir!.x, dir!.z)).toBeCloseTo(1, 5);
    });
  });

  describe('integrate', () => {
    it('desplaza en la dirección dada por speed * dt', () => {
      const start = new THREE.Vector3(0, 1.6, 0);
      const dir = { x: 1, z: 0 };
      const next = integrate(start, dir, 1.5, 0.5, start.y);
      expect(next.x).toBeCloseTo(0.75);
      expect(next.y).toBe(1.6);
      expect(next.z).toBe(0);
    });

    it('clampa Y al floor del PLY', () => {
      const start = new THREE.Vector3(0, 5, 0);
      const next = integrate(start, { x: 0, z: 1 }, 1, 1, 1.65);
      expect(next.y).toBe(1.65);
    });

    it('dt=0 deja la posición intacta', () => {
      const start = new THREE.Vector3(1, 1.6, -1);
      const next = integrate(start, { x: 1, z: 0 }, 5, 0, 1.6);
      expect(next.x).toBe(1);
      expect(next.z).toBe(-1);
    });
  });
});
