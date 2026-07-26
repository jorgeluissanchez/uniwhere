import { Button } from '@/core/components/ui/button';
import { Icon } from '@/core/components/ui/icon';
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
      <Text variant="small" className="text-muted-foreground">Fotos ({photos.length}/100)</Text>

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
              {/* El botón va encima de la miniatura, no sobre una superficie
                  del tema: los tokens `canvas` son los que garantizan contraste
                  contra una foto cualquiera en claro y oscuro por igual. */}
              {!disabled && (
                <Pressable
                  onPress={() => remove(i)}
                  className="absolute top-5 left-5 w-6 h-6 rounded-full bg-canvas/55 items-center justify-center"
                >
                  <Icon as={Minus} size={14} className="text-canvas-foreground" strokeWidth={2.5} />
                </Pressable>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <Button variant="outline" onPress={pick} disabled={disabled} className="border-dashed border-primary">
        <Text className="text-primary">
          {photos.length === 0 ? 'Seleccionar fotos' : 'Agregar más fotos'}
        </Text>
      </Button>
    </View>
  );
}
