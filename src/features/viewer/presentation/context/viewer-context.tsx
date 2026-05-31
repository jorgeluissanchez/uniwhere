import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { PlyCloud } from '@/features/viewer/domain/entities/ply-cloud';
import { PlyRepository } from '@/features/viewer/domain/repositories/ply-repository';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ViewerContextType = {
  cloud: PlyCloud | null;
  loading: boolean;
  error: string | null;
  loadFile: () => Promise<boolean>;
  loadFromPath: (fileUri: string) => Promise<boolean>;
};

const ViewerContext = createContext<ViewerContextType | undefined>(undefined);

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<PlyRepository>(TOKENS.ViewerRepo), [di]);

  const [cloud, setCloud] = useState<PlyCloud | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (fn: () => Promise<PlyCloud>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      setCloud(await fn());
      return true;
    } catch (e: unknown) {
      if (e instanceof Error && /cancel/i.test(e.message)) return false;
      setError(e instanceof Error ? e.message : 'Error desconocido al cargar el archivo PLY');
      return false;
    } finally {
      setLoading(false);
    }
  }, [repo]);

  const loadFile = useCallback(
    () => load(() => repo.loadFromFile()),
    [load, repo],
  );

  const loadFromPath = useCallback(
    (fileUri: string) => load(() => repo.loadFromPath(fileUri)),
    [load, repo],
  );

  return (
    <ViewerContext.Provider value={{ cloud, loading, error, loadFile, loadFromPath }}>
      {children}
    </ViewerContext.Provider>
  );
}

export function useViewer(): ViewerContextType {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error('useViewer debe usarse dentro de ViewerProvider');
  return ctx;
}
