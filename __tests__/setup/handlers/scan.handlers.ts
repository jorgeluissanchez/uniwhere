import { http, HttpResponse } from 'msw';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost';
const PROJECT = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID ?? 'test-project';
const DB = `${BASE}/database/${PROJECT}`;
const RECON = process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL ?? 'http://localhost:8000';

export const MOCK_SCAN_ROW = {
  _id: 'scan-1',
  user_id: 'user-123',
  job_id: 'job-abc',
  serie: 'serie-x',
  tipo: 'dense',
  local_uri: '',
  created_at: '2026-01-01T00:00:00Z',
};

export const scanHandlers = [
  http.get(`${DB}/read`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('tableName') === 'scan') {
      return HttpResponse.json([MOCK_SCAN_ROW]);
    }
    return HttpResponse.json([]);
  }),

  http.post(`${DB}/insert`, () => HttpResponse.json({ inserted: 1 })),

  http.put(`${DB}/update`, () => HttpResponse.json({ updated: 1 })),

  http.delete(`${DB}/delete`, () => HttpResponse.json({ deleted: 1 })),

  // Portada — asserts ngrok header
  http.get(`${RECON}/:serie/portada`, ({ request }) => {
    if (!request.headers.get('ngrok-skip-browser-warning')) {
      return new HttpResponse(null, { status: 400, statusText: 'Missing ngrok header' });
    }
    return new HttpResponse(new Uint8Array([0xff]).buffer as ArrayBuffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }),
];
