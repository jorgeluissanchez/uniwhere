import { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';

interface Props {
  onFps: (fps: number) => void;
}

export function FpsCounter({ onFps }: Props) {
  const frames = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      onFps(frames.current);
      frames.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}
