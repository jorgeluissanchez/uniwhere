import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ReconstructionProvider, useReconstruction } from '@/features/reconstruction/presentation/context/reconstruction-context';
import { DIProvider } from '@/core/di/di-provider';
import { server } from '../setup/msw-server';
import { http, HttpResponse } from 'msw';

const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DIProvider>
      <ReconstructionProvider>{children}</ReconstructionProvider>
    </DIProvider>
  );
}

const sampleParams = {
  serie: 'test-serie',
  photos: [{ uri: 'file://photo.jpg', name: 'photo.jpg', type: 'image/jpeg' }],
  inferGs: false,
};

describe('Reconstruction integration — full flow with real data source + MSW', () => {
  it('startJob returns jobId and serie from MSW-intercepted response', async () => {
    const { result } = renderHook(() => useReconstruction(), { wrapper: Wrapper });

    let jobResult: { jobId: string; serie: string } | undefined;
    await act(async () => {
      jobResult = await result.current.startJob(sampleParams);
    });

    expect(jobResult?.jobId).toBe('job-abc');
    expect(jobResult?.serie).toBe('serie-x');
    expect(result.current.submitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('startJob sets error on HTTP failure', async () => {
    server.use(
      http.post(`${RECON}/reconstruct`, () =>
        HttpResponse.json({ detail: 'Error del servidor' }, { status: 500 })
      ),
    );

    const { result } = renderHook(() => useReconstruction(), { wrapper: Wrapper });

    await act(async () => {
      try {
        await result.current.startJob(sampleParams);
      } catch {
        // expected
      }
    });

    expect(result.current.error).toContain('Error del servidor');
    expect(result.current.submitting).toBe(false);
  });
});
