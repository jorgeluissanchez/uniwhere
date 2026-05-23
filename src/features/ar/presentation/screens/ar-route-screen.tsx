// src/features/ar/presentation/screens/ar-route-screen.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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

// Separate component so useControls() always runs (Rules of Hooks — no conditionals above it)
function ARCanvas({ savedRoute }: { savedRoute: NonNullable<ReturnType<typeof useARRoute>['savedRoute']> }) {
  const [OrbitControls, events] = useControls();

  return (
    // events spread on the wrapping View lets OrbitControls capture touch gestures
    <View style={StyleSheet.absoluteFill} {...events}>
      <Canvas
        style={StyleSheet.absoluteFill}
        gl={{ alpha: true }}
        camera={{ position: [0, 0, 1.5], fov: 70 }}
      >
        <OrbitControls />
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 3]} intensity={1.0} />

        {savedRoute.map((point, i) => (
          <BreadcrumbModel
            key={`${point.row}-${point.col}-${i}`}
            position={gridToWorld(point)}
            index={i}
          />
        ))}
      </Canvas>
    </View>
  );
}

export function ARRouteScreen() {
  const { savedRoute, loadSavedRoute } = useARRoute();
  const [permission, requestPermission] = useCameraPermissions();
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
      <ARCanvas savedRoute={savedRoute} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  backButton: { position: 'absolute', top: 48, left: 16 },
  badge: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
