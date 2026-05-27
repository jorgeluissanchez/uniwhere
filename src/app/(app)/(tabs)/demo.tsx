import { MeshViewerProvider } from '@/features/mesh-viewer/presentation/context/mesh-viewer-context';
import { MeshViewerScreen } from '@/features/mesh-viewer/presentation/screens/mesh-viewer-screen';
import React from 'react';

export default function DemoTab() {
  return (
    <MeshViewerProvider>
      <MeshViewerScreen />
    </MeshViewerProvider>
  );
}
