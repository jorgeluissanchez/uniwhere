// src/features/ar/presentation/context/ar-route-context.tsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { RoutePoint, SavedRoute } from '@/features/ar/domain/entities/route';
import { RouteRepository } from '@/features/ar/domain/repositories/route-repository';

type ARRouteContextType = {
  route: RoutePoint[];
  savedRoute: SavedRoute | null;
  saving: boolean;
  error: string | null;
  addPoint: (point: RoutePoint) => void;
  resetRoute: () => void;
  saveRoute: () => Promise<void>;
  loadSavedRoute: () => Promise<void>;
};

const ARRouteContext = createContext<ARRouteContextType | undefined>(undefined);

export function ARRouteProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<RouteRepository>(TOKENS.AR_RouteRepo), [di]);

  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [savedRoute, setSavedRoute] = useState<SavedRoute | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevents adding the same point twice in a row
  const addPoint = useCallback((point: RoutePoint) => {
    setRoute(prev => {
      const last = prev[prev.length - 1];
      if (last && last.row === point.row && last.col === point.col) return prev;
      return [...prev, point];
    });
  }, []);

  const resetRoute = useCallback(() => setRoute([]), []);

  const saveRoute = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await repo.saveRoute(route);
      setSavedRoute(route);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la ruta');
    } finally {
      setSaving(false);
    }
  }, [repo, route]);

  const loadSavedRoute = useCallback(async () => {
    try {
      const loaded = await repo.loadRoute();
      setSavedRoute(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la ruta');
    }
  }, [repo]);

  // Load any previously saved route when provider mounts
  useEffect(() => { loadSavedRoute(); }, [loadSavedRoute]);

  return (
    <ARRouteContext.Provider value={{
      route, savedRoute, saving, error,
      addPoint, resetRoute, saveRoute, loadSavedRoute,
    }}>
      {children}
    </ARRouteContext.Provider>
  );
}

export function useARRoute(): ARRouteContextType {
  const ctx = useContext(ARRouteContext);
  if (!ctx) throw new Error('useARRoute debe usarse dentro de ARRouteProvider');
  return ctx;
}
