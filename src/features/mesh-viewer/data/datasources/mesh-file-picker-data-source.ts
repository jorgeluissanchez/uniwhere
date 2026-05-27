export interface MeshFilePickerDataSource {
  pickFile(): Promise<string>; // returns file URI; throws 'cancelado' on cancel
}
