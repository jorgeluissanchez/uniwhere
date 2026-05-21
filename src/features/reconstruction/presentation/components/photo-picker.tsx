import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';

export type PickedPhoto = {
  uri: string;
  name: string;
  type: string;
};

interface Props {
  photos: PickedPhoto[];
  onPhotosChange: (photos: PickedPhoto[]) => void;
  disabled?: boolean;
}

export function PhotoPicker({ photos, onPhotosChange, disabled }: Props) {
  const pick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const picked: PickedPhoto[] = result.assets.map(
        (a: DocumentPicker.DocumentPickerAsset, i: number) => ({
          uri: a.uri,
          name: a.name ?? `foto_${Date.now()}_${i}.jpg`,
          type: a.mimeType ?? 'image/jpeg',
        })
      );
      onPhotosChange([...photos, ...picked].slice(0, 100));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir la galería');
    }
  };

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center justify-between">
        <Text variant="small" className="text-gray-600">Fotos ({photos.length}/100)</Text>
        {photos.length > 0 && (
          <Button variant="ghost" size="sm" onPress={() => onPhotosChange([])} disabled={disabled}>
            <Text className="text-destructive text-xs">Limpiar</Text>
          </Button>
        )}
      </View>

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-[70px]">
          {photos.map((p: PickedPhoto, i: number) => (
            <Image key={i} source={{ uri: p.uri }} className="w-14 h-14 rounded-md mr-1.5" />
          ))}
        </ScrollView>
      )}

      <Button variant="outline" onPress={pick} disabled={disabled} className="border-dashed border-blue-500">
        <Text className="text-blue-500">
          {photos.length === 0 ? 'Seleccionar fotos' : 'Agregar más fotos'}
        </Text>
      </Button>
    </View>
  );
}
