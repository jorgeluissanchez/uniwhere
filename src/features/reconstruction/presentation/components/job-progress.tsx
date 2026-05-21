import { Text } from '@/core/components/ui/text';
import { JobStatus, ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';
import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

const STATUS_COLOR: Record<JobStatus, string> = {
  pending: '#f5a623',
  running: '#3B82F6',
  done:    '#27ae60',
  error:   '#ef4444',
  timeout: '#ef4444',
};

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'En espera',
  running: 'Procesando',
  done:    'Completado',
  error:   'Error',
  timeout: 'Tiempo agotado',
};

interface Props {
  job: ReconstructionJob;
}

export function JobProgress({ job }: Props) {
  const color = STATUS_COLOR[job.status];
  const isActive = job.status === 'pending' || job.status === 'running';

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-2">
        {isActive && <ActivityIndicator size="small" color={color} />}
        <View
          className="rounded-xl px-2.5 py-0.5 border"
          style={{ backgroundColor: color + '22', borderColor: color }}
        >
          <Text className="text-xs font-bold" style={{ color }}>
            {STATUS_LABEL[job.status]}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">#{job.jobId.slice(0, 8)}</Text>
      </View>

      {!!job.error && (
        <Text className="text-sm text-destructive">{job.error}</Text>
      )}

      {job.progress.length > 0 && (
        <ScrollView className="bg-gray-100 rounded-lg p-2.5 max-h-40" nestedScrollEnabled>
          {job.progress.map((line, i) => (
            <Text key={i} className="text-xs text-gray-600 leading-5 font-mono">› {line}</Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
