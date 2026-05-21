import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { ReconstructionJob } from '@/features/reconstruction/domain/entities/reconstruction-job';
import { ReconstructionRepository, StartJobParams } from '@/features/reconstruction/domain/repositories/reconstruction-repository';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 3000;

type ReconstructionContextType = {
  job: ReconstructionJob | null;
  submitting: boolean;
  downloading: boolean;
  error: string | null;
  startJob: (params: StartJobParams) => Promise<void>;
  downloadPly: (tipo?: 'dense' | 'splat') => Promise<string>;
  reset: () => void;
};

const ReconstructionContext = createContext<ReconstructionContextType | undefined>(undefined);

export function ReconstructionProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<ReconstructionRepository>(TOKENS.ReconstructionRepo), [di]);

  const [job, setJob] = useState<ReconstructionJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const updated = await repo.getStatus(jobId);
        setJob(updated);
        if (updated.status === 'done' || updated.status === 'error' || updated.status === 'timeout') {
          stopPolling();
        }
      } catch (e) {
        stopPolling();
        setError(e instanceof Error ? e.message : 'Error al consultar el estado del trabajo');
      }
    }, POLL_INTERVAL_MS);
  }, [repo, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startJob = useCallback(async (params: StartJobParams) => {
    setSubmitting(true);
    setError(null);
    setJob(null);
    try {
      const { jobId } = await repo.startJob(params);
      const initial = await repo.getStatus(jobId);
      setJob(initial);
      startPolling(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el trabajo de reconstrucción');
    } finally {
      setSubmitting(false);
    }
  }, [repo, startPolling]);

  const downloadPly = useCallback(async (tipo: 'dense' | 'splat' = 'dense'): Promise<string> => {
    if (!job) throw new Error('No hay trabajo activo para descargar');
    setDownloading(true);
    setError(null);
    try {
      return await repo.downloadPly(job.jobId, tipo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al descargar el archivo PLY';
      setError(msg);
      throw new Error(msg);
    } finally {
      setDownloading(false);
    }
  }, [job, repo]);

  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setError(null);
    setSubmitting(false);
    setDownloading(false);
  }, [stopPolling]);

  return (
    <ReconstructionContext.Provider value={{ job, submitting, downloading, error, startJob, downloadPly, reset }}>
      {children}
    </ReconstructionContext.Provider>
  );
}

export function useReconstruction(): ReconstructionContextType {
  const ctx = useContext(ReconstructionContext);
  if (!ctx) throw new Error('useReconstruction debe usarse dentro de ReconstructionProvider');
  return ctx;
}
