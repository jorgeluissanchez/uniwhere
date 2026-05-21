import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import React from 'react';
import { useAuth } from '../context/auth-context';

export function LogoutButton() {
  const { logout } = useAuth();

  return (
    <Button testID="logout-button" variant="outline" size="sm" onPress={logout}>
      <Text>Cerrar sesión</Text>
    </Button>
  );
}
