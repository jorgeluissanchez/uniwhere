import { TOKENS } from '@/core/constants/tokens';
import { useDI } from '@/core/di/di-provider';
import { LocalizationResult } from '@/features/localization/domain/entities/localization-result';
import { LocalizationRepository, LocalizationImageParam } from '@/features/localization/domain/repositories/localization-repository';
import { Scan } from '@/features/scan/domain/entities/scan';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

type LocalizationContextType = {
  selectedScan: Scan | null;
  image: PickedImage | null;
  submitting: boolean;
  error: string | null;
  result: LocalizationResult | null;
  setSelectedScan: (scan: Scan | null) => void;
  setImage: (image: PickedImage | null) => void;
  submit: () => Promise<boolean>;
  reset: () => void;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<LocalizationRepository>(TOKENS.Localization_Repo), [di]);

  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LocalizationResult | null>(null);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!selectedScan || !image) return false;
    setSubmitting(true);
    setError(null);
    try {
      const coord = await repo.localize(selectedScan.serie, image);
      setResult(coord);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al localizar. Intenta de nuevo.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [repo, selectedScan, image]);

  const reset = useCallback(() => {
    setSelectedScan(null);
    setImage(null);
    setError(null);
    setResult(null);
  }, []);

  return (
    <LocalizationContext.Provider value={{
      selectedScan, image, submitting, error, result,
      setSelectedScan, setImage, submit, reset,
    }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextType {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization debe usarse dentro de LocalizationProvider');
  return ctx;
}
