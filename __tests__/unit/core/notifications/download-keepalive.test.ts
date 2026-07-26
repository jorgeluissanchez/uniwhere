/**
 * El foreground service en sí no se puede ejercitar en Jest — es Kotlin. Lo que
 * sí se puede verificar es el contrato del lado JS, que es donde están las
 * decisiones: que el progreso no repinte la notificación más de una vez por
 * segundo (a mayor frecuencia el sistema descarta actualizaciones), que un
 * fallo del nativo no tumbe la descarga, y que en plataformas sin el módulo
 * (iOS, web, Expo Go) todo quede en no-op.
 */
const mockNative = {
  start: jest.fn(),
  update: jest.fn(),
  stop: jest.fn(),
};

let mockModuleAvailable = true;

jest.mock('expo', () => ({
  requireOptionalNativeModule: (name: string) =>
    name === 'DownloadKeepAlive' && mockModuleAvailable ? mockNative : null,
}));

function loadModule() {
  let mod!: typeof import('@/core/notifications/download-keepalive');
  jest.isolateModules(() => {
    mod = require('@/core/notifications/download-keepalive');
  });
  return mod;
}

describe('download-keepalive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModuleAvailable = true;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('arranca el servicio con título y cuerpo', () => {
    const { startDownloadKeepAlive } = loadModule();
    startDownloadKeepAlive('Descargando modelo', 'Aula 12');
    expect(mockNative.start).toHaveBeenCalledWith('Descargando modelo', 'Aula 12');
  });

  it('descarta actualizaciones de progreso a menos de un segundo de la anterior', () => {
    const { startDownloadKeepAlive, updateDownloadKeepAlive } = loadModule();
    startDownloadKeepAlive('Descargando modelo', 'Aula 12');

    jest.advanceTimersByTime(300);
    updateDownloadKeepAlive('Aula 12 · 10%');
    jest.advanceTimersByTime(300);
    updateDownloadKeepAlive('Aula 12 · 20%');
    expect(mockNative.update).not.toHaveBeenCalled();

    // Ya pasó el segundo desde el arranque: esta sí pasa.
    jest.advanceTimersByTime(500);
    updateDownloadKeepAlive('Aula 12 · 30%');
    expect(mockNative.update).toHaveBeenCalledTimes(1);
    expect(mockNative.update).toHaveBeenCalledWith('Aula 12 · 30%');
  });

  it('detiene el servicio', () => {
    const { stopDownloadKeepAlive } = loadModule();
    stopDownloadKeepAlive();
    expect(mockNative.stop).toHaveBeenCalled();
  });

  it('no propaga un fallo del nativo: la descarga no debe caerse por el aviso', () => {
    mockNative.start.mockImplementation(() => {
      throw new Error('ForegroundServiceStartNotAllowedException');
    });
    const { startDownloadKeepAlive } = loadModule();
    expect(() => startDownloadKeepAlive('Descargando modelo', 'Aula 12')).not.toThrow();
  });

  it('queda en no-op donde el módulo nativo no existe', () => {
    mockModuleAvailable = false;
    const { startDownloadKeepAlive, updateDownloadKeepAlive, stopDownloadKeepAlive } = loadModule();

    expect(() => {
      startDownloadKeepAlive('Descargando modelo', 'Aula 12');
      updateDownloadKeepAlive('Aula 12 · 30%');
      stopDownloadKeepAlive();
    }).not.toThrow();
    expect(mockNative.start).not.toHaveBeenCalled();
  });
});
