import { Button } from '@/core/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/core/components/ui/drawer';
import { Text } from '@/core/components/ui/text';
import { PhotoPicker, PickedPhoto } from '@/features/reconstruction/presentation/components/photo-picker';
import { SerieInput } from '@/features/reconstruction/presentation/components/serie-input';
import { useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewScanDrawer({ open, onClose }: Props) {
  const { submitting, error, startJob } = useReconstruction();
  const { saveScan } = useScan();
  const { loggedUser } = useAuth();

  const [serie, setSerie] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const canSubmit = serie.trim().length > 0 && photos.length >= 1 && !submitting;

  const handleSubmit = async () => {
    try {
      const jobId = await startJob({ serie: serie.trim(), photos, inferGs: false });
      if (loggedUser) {
        await saveScan({
          userId:   loggedUser.userId,
          jobId,
          serie:    serie.trim(),
          tipo:     'dense',
          localUri: '',
        });
      }
      handleClose();
    } catch {
      // error shown via context
    }
  };

  const handleClose = () => {
    setSerie('');
    setPhotos([]);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent>
        <DrawerTitle style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
          Nuevo escaneo
        </DrawerTitle>

        <View style={{ flex: 1 }}>
          <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100">
            <Button
              variant="secondary"
              onPress={handleClose}
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
            <SerieInput value={serie} onChange={setSerie} disabled={submitting} />
            <PhotoPicker photos={photos} onPhotosChange={setPhotos} disabled={submitting} />

            {!!error && (
              <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <Text className="text-sm text-destructive">{error}</Text>
              </View>
            )}

            <Button onPress={handleSubmit} disabled={!canSubmit}>
              <Text>{submitting ? 'Enviando…' : 'Iniciar escaneo'}</Text>
            </Button>
          </ScrollView>
        </View>
      </DrawerContent>
    </Drawer>
  );
}
