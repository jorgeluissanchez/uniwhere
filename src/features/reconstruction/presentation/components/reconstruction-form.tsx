import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import React, { useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { JobProgress } from '@/features/reconstruction/presentation/components/job-progress';
import { PhotoPicker, PickedPhoto } from '@/features/reconstruction/presentation/components/photo-picker';
import { SerieInput } from '@/features/reconstruction/presentation/components/serie-input';

interface Props {
  onCloudReady: (fileUri: string, tipo: 'dense' | 'splat') => void;
}

export function ReconstructionForm({ onCloudReady }: Props) {
  const { job, submitting, downloading, error, startJob, downloadPly, reset } = useReconstruction();

  const [serie, setSerie] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [inferGs, setInferGs] = useState(false);

  const canSubmit = serie.length > 0 && photos.length >= 1 && !submitting && !downloading;
  const isDone = job?.status === 'done';
  const isFailed = job?.status === 'error' || job?.status === 'timeout';
  const busy = submitting || downloading;

  const handleDownloadAndView = async (tipo: 'dense' | 'splat' = 'dense') => {
    try {
      const fileUri = await downloadPly(tipo);
      onCloudReady(fileUri, tipo);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error al descargar');
    }
  };

  const handleReset = () => {
    reset();
    setSerie('');
    setPhotos([]);
    setInferGs(false);
  };

  return (
    <View className="gap-5">
      <SerieInput value={serie} onChange={setSerie} disabled={busy || !!job} />

      <PhotoPicker photos={photos} onPhotosChange={setPhotos} disabled={busy || !!job} />

      <View className="flex-row items-center justify-between">
        <Text className="text-gray-600 text-sm">Gaussian Splatting (infer_gs)</Text>
        <Switch
          value={inferGs}
          onValueChange={setInferGs}
          disabled={busy || !!job}
          trackColor={{ true: '#3B82F6' }}
        />
      </View>

      {!!error && (
        <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

      {!job && (
        <Button onPress={() => startJob({ serie, photos, inferGs })} disabled={!canSubmit}>
          <Text>{submitting ? 'Iniciando…' : 'Iniciar reconstrucción'}</Text>
        </Button>
      )}

      {job && <JobProgress job={job} />}

      {isDone && (
        <View className="gap-3">
          <Button onPress={() => handleDownloadAndView('dense')} disabled={downloading}>
            <Text>{downloading ? 'Descargando…' : 'Ver nube densa (PLY)'}</Text>
          </Button>
          {inferGs && (
            <Button
              variant="secondary"
              onPress={() => handleDownloadAndView('splat')}
              disabled={downloading}
            >
              <Text>Ver Gaussian Splat</Text>
            </Button>
          )}
        </View>
      )}

      {(isDone || isFailed) && (
        <Button variant="ghost" onPress={handleReset}>
          <Text className="text-muted-foreground text-sm underline">Nueva reconstrucción</Text>
        </Button>
      )}
    </View>
  );
}
