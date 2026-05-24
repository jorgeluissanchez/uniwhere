import { Platform } from 'react-native';
import { LocalizationRemoteDataSource } from './localization-remote-data-source';
import { LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

const TIMEOUT_MS = 30_000;

export class LocalizationRemoteDataSourceImpl implements LocalizationRemoteDataSource {
  async localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult> {
    const formData = new FormData();
    formData.append('serie', serie);

    if (Platform.OS === 'web') {
      const res = await fetch(image.uri);
      const blob = await res.blob();
      formData.append('image', new File([blob], image.name, { type: image.type }));
    } else {
      // React Native FormData accepts { uri, name, type } directly
      formData.append('image', { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/localize`,
        {
          method: 'POST',
          body: formData,
          headers: { 'ngrok-skip-browser-warning': '1' },
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status === 404) throw new Error('Serie no encontrada en el servidor.');
      if (response.status === 422) throw new Error('La imagen no es válida o no puede localizarse en este modelo.');
      throw new Error(`Error del servidor (HTTP ${response.status})`);
    }

    const body = await response.json() as { x: number; y: number; z: number };
    if (typeof body.x !== 'number' || typeof body.y !== 'number' || typeof body.z !== 'number') {
      throw new Error('Respuesta del servidor inválida: coordenadas faltantes.');
    }

    return { x: body.x, y: body.y, z: body.z };
  }
}
