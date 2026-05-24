import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { ReconstructionRepository, StartJobParams } from '@/features/reconstruction/domain/repositories/reconstruction-repository';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ReconstructionContextType = {
  submitting: boolean;
  error: string | null;
  startJob: (params: StartJobParams) => Promise<{ jobId: string; serie: string }>;
};

const ReconstructionContext = createContext<ReconstructionContextType | undefined>(undefined);

export function ReconstructionProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<ReconstructionRepository>(TOKENS.ReconstructionRepo), [di]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startJob = useCallback(async (params: StartJobParams): Promise<{ jobId: string; serie: string }> => {
    setSubmitting(true);
    setError(null);
    try {
      return await repo.startJob(params);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al iniciar el trabajo de reconstrucción';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [repo]);

  return (
    <ReconstructionContext.Provider value={{ submitting, error, startJob }}>
      {children}
    </ReconstructionContext.Provider>
  );
}

export function useReconstruction(): ReconstructionContextType {
  const ctx = useContext(ReconstructionContext);
  if (!ctx) throw new Error('useReconstruction debe usarse dentro de ReconstructionProvider');
  return ctx;
}
