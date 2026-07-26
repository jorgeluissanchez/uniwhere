import { Text } from '@/core/components/ui/text';
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import React from 'react';
import { View } from 'react-native';

interface Props {
  cloud: PlyCloud;
  fps: number;
  loading?: boolean;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-4">
      <Text className="text-white/50 text-[11px] uppercase tracking-wide">{label}</Text>
      <Text className="text-white text-xs font-semibold">{value}</Text>
    </View>
  );
}

export function HUD({ cloud, fps, loading = false }: Props) {
  return (
    <View
      className="absolute top-12 right-5 bg-black/70 border border-white/10 rounded-2xl px-4 py-3 min-w-[160px] gap-1.5"
      pointerEvents="none"
    >
      {loading ? (
        <Text className="text-white text-xs">Procesando…</Text>
      ) : (
        <>
          <Row label="Puntos" value={cloud.vertexCount.toLocaleString('es-CO')} />
          {cloud.originalVertexCount !== cloud.vertexCount && (
            <Row label="Original" value={cloud.originalVertexCount.toLocaleString('es-CO')} />
          )}
          <Row label="FPS" value={String(fps)} />
        </>
      )}
    </View>
  );
}
