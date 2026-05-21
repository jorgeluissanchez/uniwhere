import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { Minus } from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

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

  const remove = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View className="gap-2.5">
      <Text variant="small" className="text-gray-600">Fotos ({photos.length}/100)</Text>

      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {photos.map((p: PickedPhoto, i: number) => (
            <View key={i} style={{ width: 64, height: 64 }}>
              <Image
                source={{ uri: p.uri }}
                style={{ width: 64, height: 64, borderRadius: 12, opacity: 0.85 }}
              />
              {!disabled && (
                <Pressable
                  onPress={() => remove(i)}
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Minus size={14} color="#fff" strokeWidth={2.5} />
                </Pressable>
              )}
            </View>
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
