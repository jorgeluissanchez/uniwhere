import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <Text variant="h2">Ups, esta ruta no existe.</Text>
        <Button onPress={() => router.replace('/' as any)}>
          <Text>Ir al inicio</Text>
        </Button>
      </View>
    </>
  );
}