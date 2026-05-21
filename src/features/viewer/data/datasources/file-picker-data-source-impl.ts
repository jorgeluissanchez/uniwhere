import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { FilePickerDataSource, PickedFile } from '@/features/viewer/data/datasources/file-picker-data-source';

export class FilePickerDataSourceImpl implements FilePickerDataSource {
  async pick(): Promise<PickedFile> {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });

    if (result.canceled || !result.assets?.length) {
      throw new Error('No se seleccionó ningún archivo');
    }

    const asset = result.assets[0];
    const fileName = asset.name ?? `cloud_${Date.now()}.ply`;
    let fileUri = asset.uri;

    // content:// URIs no soportan lectura por offset — copiar a caché primero
    if (fileUri.startsWith('content://')) {
      const cached = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: fileUri, to: cached });
      fileUri = cached;
    }

    // Garantizar prefijo file:// para expo-file-system
    if (!fileUri.startsWith('file://')) {
      fileUri = `file://${fileUri}`;
    }

    return { fileUri, fileName };
  }
}
