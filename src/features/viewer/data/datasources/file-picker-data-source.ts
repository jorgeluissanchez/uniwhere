export type PickedFile = {
  fileUri: string;
  fileName: string;
};

export interface FilePickerDataSource {
  pick(): Promise<PickedFile>;
}
