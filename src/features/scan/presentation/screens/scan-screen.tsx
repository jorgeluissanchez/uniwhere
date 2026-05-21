import { Button } from '@/core/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/core/components/ui/drawer';
import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import { NewScanDrawer } from '@/features/scan/presentation/components/new-scan-drawer';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { File, Paths } from 'expo-file-system';
import { RelativePathString, useRouter } from 'expo-router';
import { Camera, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';

export function ScanScreen() {
  const router = useRouter();
  const { scans, loading, updateScan, deleteScan } = useScan();
  const { loadFromPath } = useViewer();

  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleViewModel = async () => {
    if (!selectedScan) return;
    setViewLoading(true);
    setActionError(null);
    try {
      const remoteUrl = `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/download/${selectedScan.jobId}?tipo=${selectedScan.tipo ?? 'dense'}`;
      let uri: string;

      if (Platform.OS === 'web') {
        uri = remoteUrl;
      } else {
        const localUri = selectedScan.localUri;
        const fileExists = localUri ? new File(localUri).exists : false;
        if (fileExists) {
          uri = localUri;
        } else {
          const res = await fetch(remoteUrl, { headers: { 'ngrok-skip-browser-warning': '1' } });
          if (!res.ok) throw new Error(`Error al descargar el modelo (HTTP ${res.status})`);
          const bytes = new Uint8Array(await res.arrayBuffer());
          const dest = new File(Paths.document, `${selectedScan.jobId}_${selectedScan.tipo ?? 'dense'}.ply`);
          dest.write(bytes);
          uri = dest.uri;
          await updateScan(selectedScan._id, uri);
        }
      }

      setSelectedScan(null);
      await loadFromPath(uri);
      router.push('/viewer' as RelativePathString);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo cargar el modelo');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScan) return;
    await deleteScan(selectedScan._id);
    setSelectedScan(null);
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
            <View
              key={scan._id}
              className="bg-white rounded-2xl px-4 py-4 gap-1.5 border border-gray-200 active:opacity-70"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                  {scan.serie}
                </Text>
                <View className="bg-blue-50 border border-blue-300 rounded-full px-2.5 py-0.5">
                  <Text className="text-blue-600 text-xs">{scan.tipo}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs">
                {scan.createdAt
                  ? new Date(scan.createdAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''}
              </Text>
              <Button variant="outline" onPress={() => setSelectedScan(scan)}>
                <Text>Ver Detalles</Text>
              </Button>
            </View>
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

      <NewScanDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />

      {/* Drawer de opciones del scan seleccionado */}
      <Drawer
        open={!!selectedScan}
        onOpenChange={(o) => { if (!o && !viewLoading) setSelectedScan(null); }}
      >
        <DrawerContent>
          <DrawerTitle style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
            Opciones de escaneo
          </DrawerTitle>

          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100">
              <Button
                variant="secondary"
                onPress={() => { if (!viewLoading) setSelectedScan(null); }}
                className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              >
                <X size={20} color="#374151" />
              </Button>
              <Text variant="h4" className="text-center flex-1" numberOfLines={1}>
                {selectedScan?.serie?.toUpperCase()}
              </Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 12 }}
            >
              <Text className="text-gray-400 text-sm text-center">
                {selectedScan?.tipo?.toUpperCase()}
                {selectedScan?.createdAt
                  ? ` · ${new Date(selectedScan.createdAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ''}
              </Text>

              <Button onPress={handleViewModel} disabled={viewLoading}>
                {viewLoading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text>Ver Modelo</Text>
                }
              </Button>

              {!!actionError && (
                <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <Text className="text-sm text-destructive">{actionError}</Text>
                </View>
              )}

              <Button variant="secondary" disabled>
                <Text className="text-gray-400">Probar VPS</Text>
              </Button>

              <Button variant="ghost" onPress={handleDelete} disabled={viewLoading}>
                <Text className="text-destructive text-sm">Eliminar</Text>
              </Button>
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>
    </View>
  );
}