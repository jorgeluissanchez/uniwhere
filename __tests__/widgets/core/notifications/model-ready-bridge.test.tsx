/**
 * El puente es lo que convierte la notificación en algo útil: sin él, tocarla
 * solo traía al usuario a la app y tenía que buscar el escaneo a mano.
 *
 * Se cubren los dos caminos por los que puede llegar un toque (app viva vs.
 * arranque en frío), que no se pisen entre sí, y que un modelo que ya no está
 * en disco no mande al usuario a un visor vacío.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  RelativePathString: '',
}));

const mockLoadFromPath = jest.fn();
jest.mock('@/features/viewer/presentation/context/viewer-context', () => ({
  useViewer: () => ({ loadFromPath: mockLoadFromPath }),
}));

let mockListener: ((payload: unknown) => void) | null = null;
const mockRemove = jest.fn();
let mockLaunchPayload: unknown = null;

jest.mock('@/core/notifications/model-download-notifications', () => ({
  addModelReadyListener: (cb: (payload: unknown) => void) => {
    mockListener = cb;
    return mockRemove;
  },
  getLaunchModelReady: () => Promise.resolve(mockLaunchPayload),
}));

import { ModelReadyBridge } from '@/core/notifications/model-ready-bridge';

const PAYLOAD = {
  serie: 'Casa',
  scanId: 'scan-1',
  localUri: 'file:///documents/job-1_dense.ply',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockListener = null;
  mockLaunchPayload = null;
  mockLoadFromPath.mockResolvedValue(true);
});

describe('ModelReadyBridge', () => {
  it('abre el modelo cuando se toca la notificación con la app viva', async () => {
    render(<ModelReadyBridge />);
    await waitFor(() => expect(mockListener).not.toBeNull());

    mockListener!(PAYLOAD);

    await waitFor(() => expect(mockLoadFromPath).toHaveBeenCalledWith(PAYLOAD.localUri));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/viewer'));
  });

  it('abre el modelo cuando el toque arrancó la app desde cero', async () => {
    mockLaunchPayload = PAYLOAD;

    render(<ModelReadyBridge />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/viewer'));
  });

  it('no abre dos veces si el mismo aviso llega por los dos caminos', async () => {
    mockLaunchPayload = PAYLOAD;

    render(<ModelReadyBridge />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));

    mockListener!(PAYLOAD);

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  });

  it('no navega si el archivo ya no se puede leer', async () => {
    mockLoadFromPath.mockResolvedValue(false);

    render(<ModelReadyBridge />);
    await waitFor(() => expect(mockListener).not.toBeNull());

    mockListener!(PAYLOAD);

    await waitFor(() => expect(mockLoadFromPath).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('se da de baja del listener al desmontarse', async () => {
    const { unmount } = render(<ModelReadyBridge />);
    await waitFor(() => expect(mockListener).not.toBeNull());

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
