import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { Scan } from '@/features/scan/domain/entities/scan';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { NewScanDrawer } from '@/features/scan/presentation/components/new-scan-drawer';
import { ScanListItem } from '@/features/scan/presentation/components/scan-list-item';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { Camera } from 'lucide-react-native';
import { RelativePathString, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

export function ScanScreen() {
  const router = useRouter();
  const { loggedUser } = useAuth();
  const { scans, loading, saveScan, deleteScan } = useScan();
  const { loadFromPath } = useViewer();

  const [showForm, setShowForm] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleCloudReady = async (
    fileUri: string,
    tipo: 'dense' | 'splat',
    jobId: string,
    serie: string,
  ) => {
    if (jobId && serie && loggedUser) {
      try {
        await saveScan({
          userId:   loggedUser.userId,
          jobId,
          serie,
          tipo,
          localUri: fileUri,
        });
      } catch (e) {
        Alert.alert('Error al guardar', e instanceof Error ? e.message : 'No se pudo guardar el escaneo');
      }
    }
    await loadFromPath(fileUri);
    setShowForm(false);
    router.push('/viewer' as RelativePathString);
  };

  const handleView = async (scan: Scan) => {
    setViewingId(scan.scanId);
    try {
      await loadFromPath(scan.localUri);
      router.push('/viewer' as RelativePathString);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el archivo PLY');
    } finally {
      setViewingId(null);
    }
  };

  const handleDelete = (scan: Scan) => {
    Alert.alert(
      'Eliminar escaneo',
      `¿Eliminar "${scan.serie}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteScan(scan.scanId) },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-5 pt-10 pb-4 flex-row items-center justify-between">
        <Text variant="h3" className="text-gray-900">Mis escaneos</Text>
        <Button size="sm" onPress={() => setShowForm(true)} className="flex-row gap-1.5">
          <Camera size={16} color="white" />
          <Text className="text-white text-sm">Nuevo</Text>
        </Button>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : scans.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Camera size={48} color="#BFDBFE" />
          <Text className="text-gray-400 text-center">
            Aún no tienes escaneos.{'\n'}Toca "Nuevo" para comenzar.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-16 gap-3">
          {scans.map(scan => (
            <ScanListItem
              key={scan.scanId}
              scan={scan}
              onDelete={() => handleDelete(scan)}
              onView={() => handleView(scan)}
              viewLoading={viewingId === scan.scanId}
            />
          ))}
        </ScrollView>
      )}

      <NewScanDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        onCloudReady={handleCloudReady}
      />
    </View>
  );
}
