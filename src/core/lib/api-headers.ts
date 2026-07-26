/**
 * Headers for calls to the reconstruction/localization API.
 *
 * During development that API is commonly exposed through an ngrok tunnel, whose
 * interstitial warning page must be skipped. The header is meaningless against a
 * real deployment, so it is only sent in development builds.
 */
export function reconstructionApiHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  return __DEV__ ? { 'ngrok-skip-browser-warning': '1', ...extra } : { ...extra };
}
