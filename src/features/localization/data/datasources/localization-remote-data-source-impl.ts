import { Platform } from 'react-native';
import { LocalizationRemoteDataSource } from './localization-remote-data-source';
import { LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';

const TIMEOUT_MS = 30_000;

export class LocalizationRemoteDataSourceImpl implements LocalizationRemoteDataSource {
  async localize(serie: string, image: LocalizationImageParam): Promise<LocalizationResult> {
    const formData = new FormData();

    // serie goes in the URL path, not the body
    if (Platform.OS === 'web') {
      const res = await fetch(image.uri);
      const blob = await res.blob();
      formData.append('foto', new File([blob], image.name, { type: image.type }));
    } else {
      formData.append('foto', { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        `${process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL}/${encodeURIComponent(serie)}/localize`,
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
      if (response.status === 404) throw new Error('No hay modelo ACE entrenado para esta serie. El job debe estar en estado "done".');
      if (response.status === 422) throw new Error('La imagen no es válida o el nombre de serie contiene caracteres no permitidos.');
      throw new Error(`Error del servidor (HTTP ${response.status})`);
    }

    const body = await response.json() as {
      success: boolean;
      inlier_count: number;
      translation: number[];
      rotation: number[][];
      pose: number[][];
    };

    if (!Array.isArray(body.translation) || body.translation.length < 3) {
      throw new Error('Respuesta del servidor inválida: vector de traslación faltante.');
    }

    return {
      x: body.translation[0],
      y: body.translation[1],
      z: body.translation[2],
      success: body.success,
      inlier_count: body.inlier_count,
    };
  }
}
