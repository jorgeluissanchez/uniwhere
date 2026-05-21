import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import React from 'react';
import { Pressable, View } from 'react-native';

interface Props {
  scan: Scan;
  onPress: () => void;
}

export function ScanListItem({ scan, onPress }: Props) {
  const date = new Date(scan.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <Pressable onPress={onPress}>
      <View className="bg-white rounded-2xl px-4 py-4 gap-1.5 border border-gray-200 active:opacity-70">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-900 font-semibold text-base flex-1 mr-2" numberOfLines={1}>
            {scan.serie}
          </Text>
          <View className="bg-blue-50 border border-blue-300 rounded-full px-2.5 py-0.5">
            <Text className="text-blue-600 text-xs">{scan.tipo}</Text>
          </View>
        </View>
        <Text className="text-gray-400 text-xs">{date}</Text>
      </View>
    </Pressable>
  );
}
