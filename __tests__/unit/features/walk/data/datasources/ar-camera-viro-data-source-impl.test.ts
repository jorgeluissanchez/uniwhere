import { ArCameraViroDataSourceImpl } from '@/features/walk/data/datasources/ar-camera-viro-data-source-impl';

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

    ds.publishFromViro({
      position: [1, 2, 3],
      rotation: [0, 0, 0, 1],
    });

    expect(cb).toHaveBeenCalledTimes(1);
    const pose = cb.mock.calls[0][0];
    expect(pose.position).toEqual([1, 2, 3]);
    expect(pose.rotation).toEqual([0, 0, 0, 1]);
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

    ds.publishFromViro({ position: [0, 0, 0], rotation: [0, 0, 0, 1] });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    ds.publishFromViro({ position: [0, 0, 0], rotation: [0, 0, 0, 1] });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('markUnavailable cambia el estado', () => {
    const ds = new ArCameraViroDataSourceImpl();
    ds.markUnavailable();
    expect(ds.getTrackingState()).toBe('unavailable');
  });

  it('extrae yaw de un cuaternión identidad', () => {
    const ds = new ArCameraViroDataSourceImpl();
    const cb = jest.fn();
    ds.onPoseUpdate(cb);
    ds.publishFromViro({ position: [0, 0, 0], rotation: [0, 0, 0, 1] });
    expect(cb.mock.calls[0][0].yaw).toBeCloseTo(0, 5);
  });
});

describe('WalkRepositoryImpl', () => {
  it('expone el data source AR', () => {
    const ds = new ArCameraViroDataSourceImpl();
    const repo = new (require('@/features/walk/data/repositories/walk-repository-impl').WalkRepositoryImpl)(ds);
    expect(repo.getArCamera()).toBe(ds);
  });
});
