import { Input } from '@/core/components/ui/input';
import { Text } from '@/core/components/ui/text';
import React from 'react';
import { View } from 'react-native';

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const SERIE_RE = /^[a-zA-Z0-9_-]*$/;

export function SerieInput({ value, onChange, disabled }: Props) {
  const invalid = value.length > 0 && !SERIE_RE.test(value);

  return (
    <View className="gap-1.5">
      <Text variant="small" className="text-gray-600">Nombre de serie</Text>
      <Input
        value={value}
        onChangeText={v => (SERIE_RE.test(v) || v === '') ? onChange(v) : null}
        placeholder="ej: salon_2024"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        className={invalid ? 'border-2 border-destructive' : undefined}
      />
      {invalid && (
        <Text className="text-xs text-destructive px-1">Solo letras, números, _ y -</Text>
      )}
    </View>
  );
}
