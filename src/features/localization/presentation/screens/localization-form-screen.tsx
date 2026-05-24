import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import { SeriesPicker } from '@/features/localization/presentation/components/series-picker';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { RelativePathString, useRouter } from 'expo-router';
import { ChevronLeft, ImageIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

export function LocalizationFormScreen() {
  const router = useRouter();
  const { scans } = useScan();
  const { loadFromPath } = useViewer();
  const {
    selectedScan, image, submitting, error,
    setSelectedScan, setImage, submit, reset,
  } = useLocalization();

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.name ?? `query_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const handleSubmit = async () => {
    const ok = await submit();
    if (!ok) return;
    const loaded = await loadFromPath(selectedScan!.localUri);
    if (!loaded) {
      Alert.alert('Error', 'No se pudo cargar el modelo PLY local. Intenta descargarlo de nuevo desde Mis escaneos.');
      return;
    }
    router.push('/localization-result' as RelativePathString);
  };

  const handleBack = () => {
    reset();
    router.back();
  };

  const canSubmit = !!selectedScan && !!image && !submitting;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-10 pb-4 gap-3">
        <Button
          variant="secondary"
          onPress={handleBack}
          className="rounded-full w-[44px] h-[44px] items-center justify-center p-0"
        >
          <ChevronLeft size={20} color="#374151" />
        </Button>
        <Text variant="h3" className="text-gray-900">Localización</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}
      >
        {/* Step 1: Series */}
        <View className="gap-3">
          <Text className="text-gray-700 font-semibold">1. Selecciona una serie descargada</Text>
          <SeriesPicker
            scans={scans}
            selected={selectedScan}
            onSelect={setSelectedScan}
            disabled={submitting}
          />
        </View>

        {/* Step 2: Image */}
        <View className="gap-3">
          <Text className="text-gray-700 font-semibold">2. Sube una imagen de referencia</Text>
          <Pressable onPress={submitting ? undefined : pickImage}>
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={{ width: '100%', height: 200, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-full h-32 rounded-2xl border border-dashed border-blue-400 items-center justify-center gap-2">
                <ImageIcon size={28} color="#93C5FD" />
                <Text className="text-blue-400 text-sm">Toca para seleccionar imagen</Text>
              </View>
            )}
          </Pressable>
          {image && !submitting && (
            <Button variant="ghost" onPress={pickImage}>
              <Text className="text-blue-500 text-sm">Cambiar imagen</Text>
            </Button>
          )}
        </View>

        {/* Error */}
        {!!error && (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        {/* Submit */}
        <Button onPress={handleSubmit} disabled={!canSubmit}>
          {submitting
            ? <ActivityIndicator size="small" color="white" />
            : <Text>Localizar</Text>
          }
        </Button>
      </ScrollView>
    </View>
  );
}
