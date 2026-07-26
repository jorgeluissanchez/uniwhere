import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { useAuth } from '@/features/auth/presentation/context/auth-context';
import { Scan } from '@/features/scan/domain/entities/scan';
import { ScanRepository, SaveScanParams } from '@/features/scan/domain/repositories/scan-repository';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/** Reintentos por portada antes de rendirse, con espera creciente entre ellos. */
const PORTADA_ATTEMPTS = 3;
const PORTADA_BACKOFF_MS = 600;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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

  // Invalida las cargas de portadas en vuelo cuando llega un refresh nuevo (o
  // cambia el usuario), para que una respuesta vieja no pise la lista actual.
  const portadaRunRef = useRef(0);

  /**
   * Las portadas se cargan aparte de la lista para no retrasarla, pero con
   * reintentos: antes un fallo puntual de red dejaba la tarjeta sin imagen
   * hasta que el usuario recargara la app entera, porque nada lo volvía a
   * intentar en toda la sesión.
   */
  const loadPortadasInBackground = useCallback((scansToCheck: Scan[]) => {
    const run = ++portadaRunRef.current;

    scansToCheck.forEach(scan => {
      void (async () => {
        for (let attempt = 0; attempt < PORTADA_ATTEMPTS; attempt++) {
          const uri = await repo.fetchPortada(scan.serie).catch(() => null);
          if (portadaRunRef.current !== run) return;

          if (uri) {
            setPortadas(prev => (prev[scan.serie] === uri ? prev : { ...prev, [scan.serie]: uri }));
            return;
          }

          if (attempt < PORTADA_ATTEMPTS - 1) {
            await delay(PORTADA_BACKOFF_MS * 2 ** attempt);
            if (portadaRunRef.current !== run) return;
          }
        }
      })();
    });
  }, [repo]);

  const refresh = useCallback(async () => {
    if (!loggedUser?.userId) {
      // Sin sesión no debe quedar nada del usuario anterior.
      portadaRunRef.current++;
      setScans([]);
      setPortadas({});
      return;
    }
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
