import * as DocumentPicker from 'expo-document-picker';
import { MeshFilePickerDataSource } from './mesh-file-picker-data-source';

export class MeshFilePickerDataSourceImpl implements MeshFilePickerDataSource {
  async pickFile(): Promise<string> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      throw new Error('cancelado');
    }

    return result.assets[0].uri;
  }
}
