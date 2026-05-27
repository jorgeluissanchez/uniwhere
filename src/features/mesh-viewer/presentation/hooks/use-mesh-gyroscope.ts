import { useEffect, useRef, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';
import * as THREE from 'three';

interface GyroscopeResult {
  eulerRef: React.MutableRefObject<THREE.Euler>;
  available: boolean;
}

export function useMeshGyroscope(): GyroscopeResult {
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;
    let offsetAlpha = 0;
    let offsetBeta = 0;
    let offsetGamma = 0;
    let hasOffset = false;

    async function setup() {
      const isAvailable = await DeviceMotion.isAvailableAsync();
      if (!isAvailable) return;

      const { granted } = await DeviceMotion.requestPermissionsAsync();
      if (!granted) return;

      DeviceMotion.setUpdateInterval(16);
      setAvailable(true);

      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;

        if (!hasOffset) {
          offsetAlpha = rotation.alpha;
          offsetBeta  = rotation.beta;
          offsetGamma = rotation.gamma;
          hasOffset   = true;
          return;
        }

        eulerRef.current.set(
          rotation.beta  - offsetBeta,    // pitch (x)
          rotation.alpha - offsetAlpha,   // yaw   (y)
          rotation.gamma - offsetGamma,   // roll  (z)
          'YXZ',
        );
      });
    }

    setup();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { eulerRef, available };
}
