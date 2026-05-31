import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { LocalizationProvider, useLocalization } from '@/features/localization/presentation/context/localization-context';
import { DIProvider } from '@/core/di/di-provider';
import { server } from '../setup/msw-server';
import { http, HttpResponse } from 'msw';

const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

const MOCK_SCAN = {
  _id: 's1', userId: 'u1', jobId: 'j1',
  serie: 'test-serie', tipo: 'dense' as const, localUri: '', createdAt: '',
};
const MOCK_IMAGE = { uri: 'file://img.jpg', name: 'img.jpg', type: 'image/jpeg' };

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DIProvider>
      <LocalizationProvider>{children}</LocalizationProvider>
    </DIProvider>
  );
}

describe('Localization integration — full flow with real data source + MSW', () => {
  it('submit returns false when selectedScan or image is null', async () => {
    const { result } = renderHook(() => useLocalization(), { wrapper: Wrapper });

    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.submit(); });
    expect(ok).toBe(false);
  });

  it('submit calls localize endpoint and sets result', async () => {
    const { result } = renderHook(() => useLocalization(), { wrapper: Wrapper });

    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.submit(); });

    expect(ok).toBe(true);
    expect(result.current.result).toEqual({
      x: 1.1, y: 2.2, z: 3.3, success: true, inlier_count: 42,
    });
    expect(result.current.error).toBeNull();
  });

  it('submit sets error on 422 response', async () => {
    server.use(
      http.post(`${RECON}/:serie/localize`, () =>
        new HttpResponse(null, { status: 422 })
      ),
    );

    const { result } = renderHook(() => useLocalization(), { wrapper: Wrapper });

    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });

    await act(async () => { await result.current.submit(); });

    expect(result.current.error).toContain('caracteres no permitidos');
    expect(result.current.result).toBeNull();
  });

  it('reset clears result and scan after successful submit', async () => {
    const { result } = renderHook(() => useLocalization(), { wrapper: Wrapper });

    act(() => {
      result.current.setSelectedScan(MOCK_SCAN);
      result.current.setImage(MOCK_IMAGE);
    });
    await act(async () => { await result.current.submit(); });

    act(() => result.current.reset());

    expect(result.current.result).toBeNull();
    expect(result.current.selectedScan).toBeNull();
    expect(result.current.image).toBeNull();
  });
});
