/**
 * Hook del joystick virtual.
 *
 * Razona en dos dominios:
 *  - reanimated worklets (UI thread): `panX`, `panZ` son SharedValues que el
 *    Pan gesture actualiza.
 *  - main thread (r3f): `walkVectorRef` es un objeto plano que `useFrame`
 *    lee. Reanimated dispone de `runOnJS` para mandar snapshots al JS.
 *
 * Para evitar trabajo extra por frame, lo que copiamos es solo x/z del
 * joystick normalizado (-1..1), no Vector3.
 */
import { useCallback, useRef } from "react";
import { runOnJS, useSharedValue, type SharedValue } from "react-native-reanimated";

export type WalkVectorRef = { x: number; z: number };

export type UseWalkJoystickResult = {
  /** Shared values para el componente del joystick (UI). */
  panX: SharedValue<number>;
  panZ: SharedValue<number>;
  /** Posición del knob dentro del pad (UI). */
  knobX: SharedValue<number>;
  knobZ: SharedValue<number>;
  /** Ref JS-thread que `useFrame` lee en r3f. */
  walkVectorRef: { current: WalkVectorRef };
  /** Velocidad actual (m/s). */
  speed: SharedValue<number>;
  /** Snapshots reanimated → JS thread. */
  syncToJS: (x: number, z: number) => void;
};

export function useWalkJoystick(): UseWalkJoystickResult {
  // posición del dedo dentro del pad (en píxeles, z = "y" del pad)
  const panX = useSharedValue(0);
  const panZ = useSharedValue(0);
  const knobX = useSharedValue(0);
  const knobZ = useSharedValue(0);
  const speed = useSharedValue(1.5);

  const walkVectorRef = useRef<WalkVectorRef>({ x: 0, z: 0 });

  const syncToJS = useCallback((x: number, z: number) => {
    walkVectorRef.current.x = x;
    walkVectorRef.current.z = z;
  }, []);

  return {
    panX,
    panZ,
    knobX,
    knobZ,
    walkVectorRef,
    speed,
    syncToJS,
  };
}

/**
 * Helper para que un worklet (en `useAnimatedStyle`/gesture) emita la
 * posición del joystick al JS thread. Importante: NO use este helper dentro
 * de un `useFrame` (eso ya corre en JS); úselo en callbacks de gesture.
 */
export function makeJoystickSync(syncToJS: (x: number, z: number) => void) {
  return (x: number, z: number) => {
    'worklet';
    runOnJS(syncToJS)(x, z);
  };
}
