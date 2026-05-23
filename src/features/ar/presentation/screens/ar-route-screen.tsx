// src/features/ar/presentation/screens/ar-route-screen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Canvas } from '@react-three/fiber/native';
import useControls from 'r3f-native-orbitcontrols';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { BreadcrumbModel } from '@/features/ar/presentation/components/breadcrumb-model';
import { useARRoute } from '@/features/ar/presentation/context/ar-route-context';
import { gridToWorld } from '@/features/ar/utils/grid-to-world';

const TILT_MIN = -Math.PI / 2;
const TILT_MAX = Math.PI / 2;
const SLIDER_W = 240;
const THUMB_R  = 12; // thumb radius

function TiltSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackW = SLIDER_W - THUMB_R * 2;
  const ratio  = (value - TILT_MIN) / (TILT_MAX - TILT_MIN);
  const thumbX = ratio * trackW;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const x = Math.max(0, Math.min(trackW, e.nativeEvent.locationX - THUMB_R));
        onChange(TILT_MIN + (x / trackW) * (TILT_MAX - TILT_MIN));
      },
      onPanResponderMove: (e) => {
        const x = Math.max(0, Math.min(trackW, e.nativeEvent.locationX - THUMB_R));
        onChange(TILT_MIN + (x / trackW) * (TILT_MAX - TILT_MIN));
      },
    })
  ).current;

  const degrees = Math.round(value * (180 / Math.PI));

  return (
    <View style={slider.wrapper}>
      <Text style={slider.label}>Inclinación  {degrees > 0 ? '+' : ''}{degrees}°</Text>
      <View style={[slider.track, { width: SLIDER_W }]} {...pan.panHandlers}>
        {/* filled portion */}
        <View style={[slider.fill, { width: thumbX + THUMB_R }]} />
        {/* thumb */}
        <View style={[slider.thumb, { transform: [{ translateX: thumbX }] }]} />
      </View>
    </View>
  );
}

// Separate component so useControls() always runs (Rules of Hooks — no conditionals above it)
function ARCanvas({
  savedRoute,
  tilt,
}: {
  savedRoute: NonNullable<ReturnType<typeof useARRoute>['savedRoute']>;
  tilt: number;
}) {
  const [OrbitControls, events] = useControls();

  return (
    <View style={StyleSheet.absoluteFill} {...events}>
      <Canvas
        style={StyleSheet.absoluteFill}
        gl={{ alpha: true }}
        camera={{ position: [0, 0, 1.5], fov: 70 }}
      >
        <OrbitControls />
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 3]} intensity={1.0} />

        {/* Rotating the whole group lets the slider tilt the grid around its center */}
        <group rotation={[tilt, 0, 0]}>
          {savedRoute.map((point, i) => (
            <BreadcrumbModel
              key={`${point.row}-${point.col}-${i}`}
              position={gridToWorld(point)}
              index={i}
            />
          ))}
        </group>
      </Canvas>
    </View>
  );
}

export function ARRouteScreen() {
  const { savedRoute, loadSavedRoute } = useARRoute();
  const [permission, requestPermission] = useCameraPermissions();
  const [tilt, setTilt] = useState(0);
  const router = useRouter();

  useEffect(() => { loadSavedRoute(); }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text className="text-center text-gray-700 mb-4 text-base">
          UniWhere necesita acceso a la cámara para la experiencia AR.
        </Text>
        <Button onPress={requestPermission}>
          <Text>Permitir cámara</Text>
        </Button>
        <Button variant="ghost" className="mt-2" onPress={() => router.back()}>
          <Text className="text-gray-500 text-sm">Volver</Text>
        </Button>
      </View>
    );
  }

  if (!savedRoute || savedRoute.length === 0) {
    return (
      <View style={styles.center}>
        <Text className="text-center text-gray-700 mb-4 text-base">
          No hay ruta guardada.{'\n'}Dibuja y guarda una ruta primero.
        </Text>
        <Button onPress={() => router.back()}>
          <Text>Volver al editor</Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera feed — real-world background */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* R3F canvas with orbit controls overlaid on camera */}
      <ARCanvas savedRoute={savedRoute} tilt={tilt} />

      {/* Back button */}
      <View style={styles.backButton}>
        <Button
          variant="secondary"
          onPress={() => router.back()}
          className="rounded-full w-[44px] h-[44px] items-center justify-center p-0"
        >
          <ChevronLeft size={20} color="#374151" />
        </Button>
      </View>

      {/* Breadcrumb count badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {savedRoute.length} breadcrumb{savedRoute.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tilt slider */}
      <View style={styles.sliderContainer}>
        <TiltSlider value={tilt} onChange={setTilt} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  backButton:      { position: 'absolute', top: 48, left: 16 },
  badge: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText:       { color: '#fff', fontSize: 13, fontWeight: '600' },
  sliderContainer: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
  },
});

const slider = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    backgroundColor: '#fff',
    top: -(THUMB_R - 3),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
