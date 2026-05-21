import { Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { Redirect, RelativePathString } from 'expo-router';

export default function AppLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href={"/login" as RelativePathString} />;
  }

  return (
        <Stack screenOptions={{ headerShown: false }} />
  );
}
