import { ARRouteProvider } from '@/features/ar/presentation/context/ar-route-context';
import { DemoScreen } from '@/features/ar/presentation/screens/demo-screen';
import React from 'react';

export default function DemoTab() {
  return (
    <ARRouteProvider>
      <DemoScreen />
    </ARRouteProvider>
  );
}
