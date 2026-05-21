import { Text } from '@/core/components/ui/text';
import { ReconstructionForm } from '@/features/reconstruction/presentation/components/reconstruction-form';
import React from 'react';
import { ScrollView, View } from 'react-native';

interface Props {
  onCloudReady: (fileUri: string) => void;
}

export function ReconstructionScreen({ onCloudReady }: Props) {
  return (
    <ScrollView className="flex-1 bg-[#0f0f1a]" contentContainerClassName="p-5 pb-16 gap-5" keyboardShouldPersistTaps="handled">
      <Text variant="h3" className="text-white">Nueva reconstrucción</Text>
      <ReconstructionForm onCloudReady={onCloudReady} />
    </ScrollView>
  );
}
