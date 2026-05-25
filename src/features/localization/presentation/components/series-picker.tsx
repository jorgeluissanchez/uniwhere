import { Button } from '@/core/components/ui/button';
import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import { Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';

function displayName(serie: string, jobId: string): string {
  const suffix = `_${jobId}`;
  return serie.endsWith(suffix) ? serie.slice(0, -suffix.length) : serie;
}

interface Props {
  scans: Scan[];
  selected: Scan | null;
  onSelect: (scan: Scan) => void;
  disabled?: boolean;
}

export function SeriesPicker({ scans, selected, onSelect, disabled }: Props) {
  const downloadedScans = scans.filter(s => !!s.localUri);

  if (downloadedScans.length === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-border px-4 py-6 items-center gap-2">
        <Text className="text-muted-foreground text-center text-sm">
          Ninguna serie descargada.{'\n'}Descarga un modelo desde "Mis escaneos" primero.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ maxHeight: 200 }}
      contentContainerStyle={{ gap: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {downloadedScans.map(scan => {
        const isSelected = selected?._id === scan._id;
        return (
          <Button
            key={scan._id}
            variant={isSelected ? 'default' : 'outline'}
            onPress={() => !disabled && onSelect(scan)}
            disabled={disabled}
            className="flex-row justify-between items-center"
          >
            <Text className={isSelected ? 'text-white' : undefined}>
              {displayName(scan.serie, scan.jobId)}
            </Text>
            {isSelected && <Check size={16} color="white" />}
          </Button>
        );
      })}
    </ScrollView>
  );
}
