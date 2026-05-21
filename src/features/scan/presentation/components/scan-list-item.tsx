import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import { Eye, Trash2 } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

interface Props {
  scan: Scan;
  onDelete: () => void;
  onView: () => void;
  viewLoading?: boolean;
}

export function ScanListItem({ scan, onDelete, onView, viewLoading = false }: Props) {
  const date = new Date(scan.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <View className="bg-white rounded-2xl px-4 py-3 gap-2 border border-gray-200">
      <View className="flex-row items-center justify-between">
        <Text className="text-gray-900 font-semibold text-base flex-1 mr-2" numberOfLines={1}>
          {scan.serie}
        </Text>
        <View className="bg-blue-50 border border-blue-300 rounded-full px-2.5 py-0.5">
          <Text className="text-blue-600 text-xs">{scan.tipo}</Text>
        </View>
      </View>

      <Text className="text-gray-400 text-xs">{date}</Text>

      <View className="flex-row gap-2 mt-1">
        <Button
          variant="outline"
          size="sm"
          onPress={onView}
          disabled={viewLoading}
          className="flex-1 border-blue-500"
        >
          <Eye size={14} color="#3B82F6" />
          <Text className="text-blue-500 text-xs ml-1">
            {viewLoading ? 'Cargando…' : 'Ver PLY'}
          </Text>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onPress={onDelete}
          className="border-destructive"
        >
          <Trash2 size={14} color="#ef4444" />
        </Button>
      </View>
    </View>
  );
}
