import { http, HttpResponse } from 'msw';

const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

export const localizationHandlers = [
  http.post(`${RECON}/:serie/localize`, ({ request }) => {
    if (!request.headers.get('ngrok-skip-browser-warning')) {
      return new HttpResponse(null, { status: 400, statusText: 'Missing ngrok header' });
    }
    return HttpResponse.json({
      success: true,
      inlier_count: 42,
      translation: [1.1, 2.2, 3.3],
      rotation: [],
      pose: [],
    });
  }),
];
