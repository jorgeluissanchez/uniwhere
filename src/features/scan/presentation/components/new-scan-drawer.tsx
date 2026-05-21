import { Button } from '@/core/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/core/components/ui/drawer';
import { Text } from '@/core/components/ui/text';
import { ReconstructionForm } from '@/features/reconstruction/presentation/components/reconstruction-form';
import { X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

interface Props {
  open: boolean;
  onClose: () => void;
  onCloudReady: (fileUri: string, tipo: 'dense' | 'splat', jobId: string, serie: string) => Promise<void> | void;
}

export function NewScanDrawer({ open, onClose, onCloudReady }: Props) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        <DrawerTitle style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
          Nuevo escaneo
        </DrawerTitle>

        <View style={{ flex: 1 }}>
          <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100">
            <Button
              variant="secondary"
              onPress={onClose}
              className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
            >
              <X size={20} color="#374151" />
            </Button>
            <Text variant="h4" className="text-center flex-1">NUEVO ESCANEO</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 20 }}
          >
            <ReconstructionForm onCloudReady={onCloudReady} />
          </ScrollView>
        </View>
      </DrawerContent>
    </Drawer>
  );
}
