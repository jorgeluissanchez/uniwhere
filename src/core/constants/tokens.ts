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
  // ar
  AR_RouteStorageDS: Symbol("AR_RouteStorageDS"),
  AR_RouteRepo:      Symbol("AR_RouteRepo"),
  // localization
  Localization_RemoteDS: Symbol("Localization_RemoteDS"),
  Localization_Repo:     Symbol("Localization_Repo"),
} as const;
