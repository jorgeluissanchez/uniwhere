import * as DocumentPicker from 'expo-document-picker';
import { FilePickerDataSource, PickedFile } from '@/features/viewer/data/datasources/file-picker-data-source';

export class FilePickerDataSourceImpl implements FilePickerDataSource {
  async pick(): Promise<PickedFile> {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });

    if (result.canceled || !result.assets?.length) {
      throw new Error('No se seleccionó ningún archivo');
    }

    const asset = result.assets[0];
    const fileName = asset.name ?? `cloud_${Date.now()}.ply`;
    const fileUri = asset.uri;

    return { fileUri, fileName };
  }
}
