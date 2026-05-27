import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { MeshModel } from '@/features/mesh-viewer/domain/entities/mesh-model';
import { IMeshRepository } from '@/features/mesh-viewer/domain/repositories/i-mesh-repository';

type MeshViewerContextType = {
  mesh: MeshModel | null;
  loading: boolean;
  error: string | null;
  loadMesh(): Promise<void>;
};

const MeshViewerContext = createContext<MeshViewerContextType | undefined>(undefined);

export function MeshViewerProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<IMeshRepository>(TOKENS.MeshRepo), [di]);

  const [mesh, setMesh] = useState<MeshModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMesh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await repo.pickAndLoad();
      if (result) setMesh(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el modelo');
    } finally {
      setLoading(false);
    }
  }, [repo]);

  return (
    <MeshViewerContext.Provider value={{ mesh, loading, error, loadMesh }}>
      {children}
    </MeshViewerContext.Provider>
  );
}

export function useMeshViewer(): MeshViewerContextType {
  const ctx = useContext(MeshViewerContext);
  if (!ctx) throw new Error('useMeshViewer debe usarse dentro de MeshViewerProvider');
  return ctx;
}
