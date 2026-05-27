export const TOKENS = {
  // auth
  AuthRemoteDS: Symbol("AuthRemoteDS"),
  AuthRepo:     Symbol("AuthRepo"),
  // viewer
  FilePickerDS: Symbol("FilePickerDS"),
  PlyParserDS:  Symbol("PlyParserDS"),
  ViewerRepo:   Symbol("ViewerRepo"),
  // reconstruction
  ReconstructionRemoteDS: Symbol("ReconstructionRemoteDS"),
  ReconstructionRepo:     Symbol("ReconstructionRepo"),
  // scan
  ScanRemoteDS: Symbol("ScanRemoteDS"),
  ScanRepo:     Symbol("ScanRepo"),
  // localization
  Localization_RemoteDS: Symbol("Localization_RemoteDS"),
  Localization_Repo:     Symbol("Localization_Repo"),
  // mesh-viewer
  MeshPickerDS: Symbol('MeshPickerDS'),
  MeshLoaderDS: Symbol('MeshLoaderDS'),
  MeshRepo:     Symbol('MeshRepo'),
} as const;
