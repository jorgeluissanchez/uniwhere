import { reconstructionApiHeaders } from '@/core/lib/api-headers';
import {
  DownloadProgress,
  isPlyCached,
  modelDownloadUrl,
} from '@/core/lib/ply-cache';
import {
  downloadModelFile,
  forgetModelDownload,
  HttpDownloadError,
  ModelDownloadHandle,
} from '@/core/lib/model-download';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent } from '@/core/components/ui/card';
import { Drawer, DrawerContent, DrawerTitle } from '@/core/components/ui/drawer';
import { Icon } from '@/core/components/ui/icon';
import { Spinner } from '@/core/components/ui/spinner';
import { Text } from '@/core/components/ui/text';
import { Scan } from '@/features/scan/domain/entities/scan';
import { NewScanDrawer } from '@/features/scan/presentation/components/new-scan-drawer';
import { useScan } from '@/features/scan/presentation/context/scan-context';
import { useViewer } from '@/features/viewer/presentation/context/viewer-context';
import { File, Paths } from 'expo-file-system';
import { RelativePathString, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useLocalization } from '@/features/localization/presentation/context/localization-context';
import { ArrowUpFromLine, Camera, Plus, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import {
  configureModelDownloadNotifications,
  ensureNotificationPermission,
  notifyModelReady,
} from '@/core/notifications/model-download-notifications';
import {
  startDownloadKeepAlive,
  stopDownloadKeepAlive,
  updateDownloadKeepAlive,
} from '@/core/notifications/download-keepalive';

function displayName(serie: string, jobId: string): string {
  const suffix = `_${jobId}`;
  return serie.endsWith(suffix) ? serie.slice(0, -suffix.length) : serie;
}

const GRID_GAP = 12;

/**
 * Fases de "Ver Modelo". El drawer permanece abierto durante todas: se cierra
 * solo al navegar al visor, o cuando el usuario cancela.
 */
type ViewPhase = 'idle' | 'downloading' | 'preparing';

const VIEW_PHASE_LABEL: Record<Exclude<ViewPhase, 'idle'>, string> = {
  downloading: 'Descargando modelo…',
  preparing: 'Preparando vista…',
};

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Etiqueta de la fase de descarga. Se prefiere el porcentaje, pero `/download`
 * transmite el PLY en streaming sin declarar `Content-Length`, así que lo
 * habitual es no poder calcularlo; en ese caso se muestran los MB recibidos, que
 * es avance real y no un spinner mudo.
 */
function downloadLabel(progress: DownloadProgress | null): string {
  if (!progress) return VIEW_PHASE_LABEL.downloading;
  if (progress.ratio !== null) {
    return `Descargando modelo… ${Math.round(progress.ratio * 100)}%`;
  }
  if (progress.loaded <= 0) return VIEW_PHASE_LABEL.downloading;
  return `Descargando modelo… ${formatMegabytes(progress.loaded)}`;
}

/**
 * Descarga el modelo traduciendo el código HTTP al mensaje que ve el usuario.
 *
 * La transferencia la hace `downloadModelFile` en el stack nativo (sesión de
 * background), no en el hilo de JS, así que sigue viva aunque el usuario salga
 * de la app; devuelve el `file://` local ya escrito.
 */
async function downloadModel(
  handle: ModelDownloadHandle,
): Promise<string> {
  try {
    return await handle.promise;
  } catch (e) {
    if (e instanceof HttpDownloadError) {
      if (e.status === 409) {
        throw new Error('El modelo aún no está listo. El procesamiento puede tardar varios minutos.');
      }
      throw new Error(`Error al descargar el modelo (HTTP ${e.status})`);
    }
    throw e;
  }
}

/**
 * Texto de la notificación persistente mientras se descarga. Lleva el nombre
 * del escaneo porque, a diferencia del drawer, se ve fuera de la app y sin
 * contexto de qué se estaba descargando.
 */
function keepAliveBody(name: string, progress: DownloadProgress | null): string {
  if (!progress) return name;
  if (progress.ratio !== null) return `${name} · ${Math.round(progress.ratio * 100)}%`;
  if (progress.loaded <= 0) return name;
  return `${name} · ${formatMegabytes(progress.loaded)}`;
}

function columnsForWidth(width: number): number {
  if (width < 640) return 1;
  if (width < 900) return 2;
  if (width < 1280) return 3;
  return 4;
}

export function ScanScreen() {
  const router = useRouter();
  const { scans, portadas, loading, updateScan, deleteScan } = useScan();
  const { loadFromPath, loadFile } = useViewer();
  const locCtx = useLocalization();

  const { width } = useWindowDimensions();
  const columns = columnsForWidth(width);

  const [showDrawer, setShowDrawer] = useState(false);
  const [showPlyAlert, setShowPlyAlert] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [viewPhase, setViewPhase] = useState<ViewPhase>('idle');
  /** Avance de la descarga en curso, o `null` si aún no llegó ningún evento. */
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const viewBusy = viewPhase !== 'idle';

  const busyLabel =
    viewPhase === 'idle'
      ? ''
      : viewPhase === 'downloading'
        ? downloadLabel(progress)
        : VIEW_PHASE_LABEL[viewPhase];

  // Nativo: el archivo en disco. Web: la entrada en Cache Storage que deja el
  // parser. Esta última solo se puede consultar de forma asíncrona, así que vive
  // en estado en vez de calcularse en el render.
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (!selectedScan) { setIsDownloaded(false); return; }

    if (Platform.OS !== 'web') {
      setIsDownloaded(!!selectedScan.localUri && new File(selectedScan.localUri).exists);
      return;
    }

    let cancelled = false;
    isPlyCached(modelDownloadUrl(selectedScan.jobId, selectedScan.tipo))
      .then((hit) => { if (!cancelled) setIsDownloaded(hit); });
    return () => { cancelled = true; };
  }, [selectedScan]);

  // Cancela la descarga en curso; `cancelled` además evita que una carga que ya
  // no se puede abortar (el parseo del PLY) termine navegando al visor.
  const downloadRef = useRef<ModelDownloadHandle | null>(null);
  const cancelledRef = useRef(false);

  const closeDrawer = () => {
    void downloadRef.current?.cancel();
    cancelledRef.current = true;
    setViewPhase('idle');
    setProgress(null);
    setActionError(null);
    setSelectedScan(null);
  };

  const handleViewModel = async () => {
    if (!selectedScan || viewBusy) return;
    const scan = selectedScan;

    cancelledRef.current = false;
    setActionError(null);
    setProgress(null);

    // Si la descarga termina con la app en segundo plano no tiene sentido
    // arrastrar al usuario al visor: se guarda y se le avisa.
    let leftApp = false;
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') leftApp = true;
    });

    // El permiso se pide aquí, al inicio del gesto del usuario que dispara una
    // descarga que puede tardar, en vez de en el arranque sin contexto. Safari
    // además exige que la petición nazca de un gesto.
    void configureModelDownloadNotifications().then(() => ensureNotificationPermission());

    // El `localUri` viaja en la notificación para que al tocarla el modelo se
    // abra directo, sin que el usuario tenga que buscar el escaneo otra vez.
    // Lo resuelve `ModelReadyBridge` en el layout raíz.
    const name = displayName(scan.serie, scan.jobId);

    const notifyReady = (localUri: string) =>
      notifyModelReady({
        serie: name,
        scanId: scan._id,
        localUri,
      });

    try {
      const remoteUrl = modelDownloadUrl(scan.jobId, scan.tipo);
      let uri: string;

      const startDownload = (fileUri: string) => {
        const handle = downloadModelFile({
          key: scan._id,
          url: remoteUrl,
          fileUri,
          headers: reconstructionApiHeaders(),
          onProgress: (next) => {
            setProgress(next);
            updateDownloadKeepAlive(keepAliveBody(name, next));
          },
        });
        downloadRef.current = handle;
        return handle;
      };

      if (Platform.OS === 'web') {
        // Se descarga aquí, y no dentro del visor, para poder informar el
        // progreso; el visor lo encuentra después en Cache Storage.
        uri = remoteUrl;
        if (!isDownloaded) {
          setViewPhase('downloading');
          await downloadModel(startDownload(remoteUrl));
          if (cancelledRef.current) return;
        }
        if (cancelledRef.current) return;
        setViewPhase('preparing');
      } else {
        const localUri = scan.localUri;
        const fileExists = localUri ? new File(localUri).exists : false;
        if (fileExists) {
          uri = localUri;
        } else {
          setViewPhase('downloading');
          // Se arranca aquí, todavía en primer plano y dentro del gesto del
          // usuario: Android 12+ rechaza levantar un foreground service desde
          // segundo plano. Es lo que evita que el sistema congele el proceso y
          // con él el aviso de "modelo listo". Se detiene en el `finally`.
          startDownloadKeepAlive('Descargando modelo', keepAliveBody(name, null));
          // El destino se fija antes de arrancar: la sesión nativa escribe
          // directo en ese archivo, así que una descarga que termina con la app
          // en segundo plano deja el PLY completo en disco sin pasar por JS.
          const dest = new File(Paths.document, `${scan.jobId}_${scan.tipo ?? 'dense'}.ply`);
          uri = await downloadModel(startDownload(dest.uri));
          await updateScan(scan._id, uri);

          if (cancelledRef.current) return;
          if (leftApp || AppState.currentState !== 'active') {
            // Ya quedó guardado: avisamos y cortamos aquí. Tocar la
            // notificación abre el modelo directamente.
            await notifyReady(uri);
            return;
          }
        }
        if (cancelledRef.current) return;
        setViewPhase('preparing');
      }

      const loaded = await loadFromPath(uri);
      if (cancelledRef.current) return;
      if (!loaded) throw new Error('No se pudo leer el modelo. Intenta descargarlo de nuevo.');

      // Si el usuario se fue mientras cargaba (en web es donde ocurre toda la
      // descarga), no lo arrastramos al visor: le avisamos y que entre él.
      if (leftApp || AppState.currentState !== 'active') {
        await notifyReady(uri);
        return;
      }

      // El drawer se cierra recién aquí, cuando ya hay algo que mostrar.
      setSelectedScan(null);
      router.push('/viewer' as RelativePathString);
    } catch (e) {
      if (cancelledRef.current || (e instanceof Error && e.name === 'AbortError')) return;
      setActionError(e instanceof Error ? e.message : 'No se pudo cargar el modelo');
    } finally {
      // Después de `notifyReady`, no antes: en cuanto el servicio cae el proceso
      // vuelve a ser congelable, y el aviso de "modelo listo" se programa en las
      // ramas de arriba. Es idempotente y no-op si nunca llegó a arrancar.
      stopDownloadKeepAlive();
      appStateSub.remove();
      downloadRef.current = null;
      setProgress(null);
      if (!cancelledRef.current) setViewPhase('idle');
    }
  };

  const handleOpenFile = async () => {
    try {
      const loaded = await loadFile();
      if (loaded) router.push('/viewer' as RelativePathString);
    } catch {
      // stay on screen
    }
  };

  const handlePlyAlertConfirm = () => {
    setShowPlyAlert(false);
    handleOpenFile();
  };

  const handleDelete = async () => {
    if (!selectedScan) return;
    // Sin esto, el estado de reanudación sobreviviría al scan y una descarga
    // futura con el mismo id retomaría bytes de un modelo que ya no existe.
    await forgetModelDownload(selectedScan._id);
    await deleteScan(selectedScan._id);
    setSelectedScan(null);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-10 pb-4">
        <Text variant="h3" className="text-foreground">Mis escaneos</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Spinner size="large" className="text-primary" />
        </View>
      ) : scans.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Icon as={Camera} size={48} className="text-primary" />
          <Text className="text-muted-foreground text-center">
            Aún no tienes escaneos.{'\n'}Toca "+" para comenzar.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-24">
          <View
            className="flex-row flex-wrap"
            style={{ marginHorizontal: -GRID_GAP / 2 }}
          >
            {scans.map(scan => (
              <View
                key={scan._id}
                style={{ width: `${100 / columns}%`, paddingHorizontal: GRID_GAP / 2, paddingBottom: GRID_GAP }}
              >
                <Card className="flex-1 rounded-2xl overflow-hidden gap-0 py-0">
                  {portadas[scan.serie] && (
                    <Image
                      source={{ uri: portadas[scan.serie] }}
                      style={{ width: '100%', height: 120 }}
                      contentFit="cover"
                    />
                  )}
                  <CardContent className="flex-1 px-4 pt-3 pb-4 gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-foreground font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                        {displayName(scan.serie, scan.jobId)}
                      </Text>
                      <View className="bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5">
                        <Text className="text-primary text-xs">{scan.tipo}</Text>
                      </View>
                    </View>
                    <Text className="text-muted-foreground text-xs">
                      {scan.createdAt
                        ? new Date(scan.createdAt).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </Text>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-auto w-full"
                      onPress={() => setSelectedScan(scan)}
                    >
                      <Text>Ver detalles</Text>
                    </Button>
                  </CardContent>
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* FABs */}
      <View className="absolute bottom-8 right-6 gap-3">
        <Button
          onPress={() => setShowDrawer(true)}
          className="w-14 h-14 rounded-full shadow-lg items-center justify-center"
        >
          <Icon as={Plus} size={26} />
        </Button>
        <Button
          onPress={() => setShowPlyAlert(true)}
          variant="secondary"
          className="w-14 h-14 rounded-full shadow-lg items-center justify-center"
        >
          <Icon as={ArrowUpFromLine} size={22} />
        </Button>
      </View>

      <NewScanDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />

      <AlertDialog open={showPlyAlert} onOpenChange={setShowPlyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solo visualización local</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo PLY que selecciones se visualizará únicamente en este dispositivo. No se guardará en la nube ni quedará asociado a ningún escaneo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancelar</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handlePlyAlertConfirm}>
              <Text>Continuar</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drawer de opciones del scan seleccionado */}
      <Drawer
        open={!!selectedScan}
        onOpenChange={(o) => { if (!o) closeDrawer(); }}
      >
        <DrawerContent>
          <DrawerTitle style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
            Opciones de escaneo
          </DrawerTitle>

          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-border">
              <Button
                variant="secondary"
                size="icon"
                accessibilityLabel={viewBusy ? 'Cancelar y cerrar' : 'Cerrar'}
                onPress={closeDrawer}
                className="w-12 h-12"
              >
                <Icon as={X} size={20} />
              </Button>
              <Text variant="h4" className="text-center flex-1" numberOfLines={1}>
                {selectedScan ? displayName(selectedScan.serie, selectedScan.jobId).toUpperCase() : ''}
              </Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 12 }}
            >
              <Text className="text-muted-foreground text-sm text-center">
                {selectedScan?.tipo?.toUpperCase()}
                {selectedScan?.createdAt
                  ? ` · ${new Date(selectedScan.createdAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ''}
              </Text>

              <Button onPress={handleViewModel} disabled={viewBusy}>
                {viewPhase === 'idle'
                  ? <Text>{isDownloaded ? 'Ver Modelo' : 'Bajar Modelo'}</Text>
                  : (
                    <>
                      <Spinner size="small" />
                      <Text>{busyLabel}</Text>
                    </>
                  )
                }
              </Button>

              {viewBusy && (
                <Text className="text-muted-foreground text-xs text-center">
                  Puedes cerrar para cancelar
                </Text>
              )}

              {!!actionError && (
                <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <Text className="text-sm text-destructive">{actionError}</Text>
                </View>
              )}

              <Button
                variant="secondary"
                disabled={viewBusy}
                onPress={() => {
                  locCtx.reset();
                  locCtx.setSelectedScan(selectedScan!);
                  setSelectedScan(null);
                  router.push('/localization' as RelativePathString);
                }}
              >
                <Text>Probar VPS</Text>
              </Button>

              <Button
                variant="secondary"
                disabled={viewBusy || !selectedScan?.localUri}
                onPress={() => {
                  const scan = selectedScan;
                  if (!scan) return;
                  // Reusa el ViewerContext ya montado globalmente: cargar el
                  // PLY antes de navegar para que la pantalla walk-view lo
                  // encuentre en `viewerContext.cloud`.
                  setSelectedScan(null);
                  router.push({ pathname: '/walk-view' as any, params: { localUri: scan.localUri ?? '' } });
                }}
              >
                <Text>Recorrer en VR</Text>
              </Button>

              <Button variant="ghost" onPress={handleDelete} disabled={viewBusy}>
                <Text className="text-destructive text-sm">Eliminar</Text>
              </Button>
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>
    </View>
  );
}