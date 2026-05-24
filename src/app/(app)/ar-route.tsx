import { ARRouteProvider } from '@/features/ar/presentation/context/ar-route-context';
import { ARRouteScreen } from '@/features/ar/presentation/screens/ar-route-screen';
import React from 'react';

export default function ARRoutePage() {
  return (
    <ARRouteProvider>
      <ARRouteScreen />
    </ARRouteProvider>
  );
}
