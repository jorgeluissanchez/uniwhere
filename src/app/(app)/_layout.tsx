import { Redirect, RelativePathString, Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { ViewerProvider } from '@/features/viewer/presentation/context/viewer-context';
import { ReconstructionProvider } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { ScanProvider } from '@/features/scan/presentation/context/scan-context';

export default function AppLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null;

  if (!isLoggedIn) {
    return <Redirect href={"/landing" as RelativePathString} />;
  }

  return (
    <ViewerProvider>
      <ReconstructionProvider>
        <ScanProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ScanProvider>
      </ReconstructionProvider>
    </ViewerProvider>
  );
}
