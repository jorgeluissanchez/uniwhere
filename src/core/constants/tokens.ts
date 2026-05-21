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
} as const;
