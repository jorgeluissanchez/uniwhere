import { Redirect, RelativePathString } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/presentation/context/auth-context';

export default function Index() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return null;
  }

  const href = (isLoggedIn ? '/scan' : '/landing') as RelativePathString;

  return <Redirect href={href} />;
}