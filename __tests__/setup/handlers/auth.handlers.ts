import { http, HttpResponse } from 'msw';

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost';
const PROJECT = process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID ?? 'test-project';
const AUTH = `${BASE}/auth/${PROJECT}`;
const DB = `${BASE}/database/${PROJECT}`;

// A minimal JWT whose payload decodes to {"sub":"user-123"}
// Payload (base64url): eyJzdWIiOiJ1c2VyLTEyMyJ9
export const FAKE_TOKEN = `fake-header.eyJzdWIiOiJ1c2VyLTEyMyJ9.fake-sig`;
export const FAKE_REFRESH = 'fake-refresh-token';
export const FAKE_USER_ID = 'user-123';

export const authHandlers = [
  http.post(`${AUTH}/login`, () =>
    HttpResponse.json({ accessToken: FAKE_TOKEN, refreshToken: FAKE_REFRESH }),
  ),

  http.post(`${AUTH}/signup-direct`, () =>
    HttpResponse.json({ message: 'ok' }),
  ),

  http.post(`${AUTH}/logout`, () =>
    HttpResponse.json({ message: 'ok' }),
  ),

  http.post(`${AUTH}/refresh-token`, () =>
    HttpResponse.json({ accessToken: FAKE_TOKEN }),
  ),

  http.get(`${AUTH}/verify-token`, () =>
    HttpResponse.json({ valid: true }, { status: 200 }),
  ),

  // DB read for user profile (called after login) — only handles tableName=user
  http.get(`${DB}/read`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('tableName') === 'user') {
      return HttpResponse.json([{
        user_id: FAKE_USER_ID,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      }]);
    }
    // passthrough to next handler for other tableName values
    return undefined;
  }),
];
