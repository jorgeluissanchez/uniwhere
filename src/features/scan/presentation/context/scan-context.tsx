import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { Scan } from '@/features/scan/domain/entities/scan';
import { ScanRepository, SaveScanParams } from '@/features/scan/domain/repositories/scan-repository';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ScanContextType = {
  scans: Scan[];
  portadas: Record<string, string>;   // serie → local image URI
  loading: boolean;
  error: string | null;
  saveScan: (params: SaveScanParams) => Promise<void>;
  updateScan: (scanId: string, localUri: string) => Promise<void>;
  deleteScan: (scanId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<ScanRepository>(TOKENS.ScanRepo), [di]);
  const { loggedUser } = useAuth();

  const [scans, setScans] = useState<Scan[]>([]);
  const [portadas, setPortadas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortadasInBackground = useCallback((scansToCheck: Scan[]) => {
    // Fire-and-forget: update portadas state as each one resolves
    scansToCheck.forEach(scan => {
      repo.fetchPortada(scan.serie).then(uri => {
        if (uri) setPortadas(prev => ({ ...prev, [scan.serie]: uri }));
      }).catch(() => {});
    });
  }, [repo]);

  const refresh = useCallback(async () => {
    if (!loggedUser?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await repo.getScansByUser(loggedUser.userId);
      setScans(result.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
      loadPortadasInBackground(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los escaneos');
    } finally {
      setLoading(false);
    }
  }, [repo, loggedUser?.userId, loadPortadasInBackground]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveScan = useCallback(async (params: SaveScanParams) => {
    await repo.saveScan(params);
    await refresh();
    // Also try to fetch portada for the new scan immediately
    repo.fetchPortada(params.serie).then(uri => {
      if (uri) setPortadas(prev => ({ ...prev, [params.serie]: uri }));
    }).catch(() => {});
  }, [repo, refresh]);

  const updateScan = useCallback(async (scanId: string, localUri: string) => {
    await repo.updateScan(scanId, localUri);
    setScans(prev => prev.map(s => s._id === scanId ? { ...s, localUri } : s));
  }, [repo]);

  const deleteScan = useCallback(async (scanId: string) => {
    await repo.deleteScan(scanId);
    setScans(prev => prev.filter(s => s._id !== scanId));
  }, [repo]);

  return (
    <ScanContext.Provider value={{ scans, portadas, loading, error, saveScan, updateScan, deleteScan, refresh }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan(): ScanContextType {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan debe usarse dentro de ScanProvider');
  return ctx;
}
