import { Redirect, RelativePathString, Stack } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';

export default function AuthLayout() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isLoggedIn) {
    return <Redirect href={"/welcome" as RelativePathString} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}