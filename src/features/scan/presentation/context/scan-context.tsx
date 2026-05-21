import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { Scan } from '@/features/scan/domain/entities/scan';
import { ScanRepository, SaveScanParams } from '@/features/scan/domain/repositories/scan-repository';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ScanContextType = {
  scans: Scan[];
  loading: boolean;
  error: string | null;
  saveScan: (params: SaveScanParams) => Promise<void>;
  deleteScan: (scanId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<ScanRepository>(TOKENS.ScanRepo), [di]);
  const { loggedUser } = useAuth();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!loggedUser?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await repo.getScansByUser(loggedUser.userId);
      setScans(result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los escaneos');
    } finally {
      setLoading(false);
    }
  }, [repo, loggedUser?.userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveScan = useCallback(async (params: SaveScanParams) => {
    await repo.saveScan(params);
    await refresh();
  }, [repo, refresh]);

  const deleteScan = useCallback(async (scanId: string) => {
    await repo.deleteScan(scanId);
    setScans(prev => prev.filter(s => s._id !== scanId));
  }, [repo]);

  return (
    <ScanContext.Provider value={{ scans, loading, error, saveScan, deleteScan, refresh }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan(): ScanContextType {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan debe usarse dentro de ScanProvider');
  return ctx;
}
