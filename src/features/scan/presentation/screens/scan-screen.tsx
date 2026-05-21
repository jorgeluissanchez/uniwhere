import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { NewScanDrawer } from '@/features/scan/presentation/components/new-scan-drawer';
import { ScanListItem } from '@/features/scan/presentation/components/scan-list-item';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { Camera, Plus } from 'lucide-react-native';
import { File, Paths } from 'expo-file-system';
import { RelativePathString, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';

export function ScanScreen() {
  const router = useRouter();
  const { scans, loading, updateScan, deleteScan } = useScan();
  const { loadFromPath } = useViewer();

  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleViewModel = async () => {
    if (!selectedScan) return;
    setViewLoading(true);
    try {
      let uri = selectedScan.localUri;

      const file = new File(uri);
      if (!file.exists) {
        const url = `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/download/${selectedScan.jobId}?tipo=${selectedScan.tipo ?? 'dense'}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error al descargar el modelo (HTTP ${res.status})`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        const dest = new File(Paths.cache, `${selectedScan.jobId}_${selectedScan.tipo ?? 'dense'}.ply`);
        dest.write(bytes);
        uri = dest.uri;
        await updateScan(selectedScan._id, uri);
      }

      setSelectedScan(null);
      await loadFromPath(uri);
      router.push('/viewer' as RelativePathString);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar el modelo');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = () => {
    if (!selectedScan) return;
    Alert.alert(
      'Eliminar escaneo',
      `¿Eliminar "${selectedScan.serie}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScan(selectedScan._id);
              setSelectedScan(null);
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar el escaneo');
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-5 pt-10 pb-4">
        <Text variant="h3" className="text-gray-900">Mis escaneos</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : scans.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Camera size={48} color="#BFDBFE" />
          <Text className="text-gray-400 text-center">
            Aún no tienes escaneos.{'\n'}Toca "+" para comenzar.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-24 gap-3">
          {scans.map(scan => (
            <ScanListItem
              key={scan._id}
              scan={scan}
              onPress={() => setSelectedScan(scan)}
            />
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <View className="absolute bottom-8 right-6">
        <Button
          onPress={() => setShowDrawer(true)}
          className="w-14 h-14 rounded-full shadow-lg items-center justify-center"
        >
          <Plus size={26} color="white" />
        </Button>
      </View>

      {/* New scan drawer */}
      <NewScanDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />

      {/* Scan options modal */}
      <Modal
        visible={!!selectedScan}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedScan(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => !viewLoading && setSelectedScan(null)}
        >
          <Pressable>
            <View className="bg-white rounded-t-3xl px-6 pt-5 pb-10 gap-3">
              <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-1" />

              <View className="mb-1">
                <Text variant="h4" className="text-gray-900">{selectedScan?.serie}</Text>
                <Text className="text-gray-400 text-sm mt-0.5">
                  {selectedScan?.tipo?.toUpperCase()}
                  {selectedScan?.createdAt
                    ? ` · ${new Date(selectedScan.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : ''}
                </Text>
              </View>

              <Button onPress={handleViewModel} disabled={viewLoading}>
                {viewLoading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text className="text-white">Ver modelo</Text>
                }
              </Button>

              <Button variant="secondary" disabled>
                <Text className="text-gray-400">Probar VPS</Text>
              </Button>

              <Button variant="ghost" onPress={handleDelete} disabled={viewLoading}>
                <Text className="text-destructive text-sm">Eliminar</Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
