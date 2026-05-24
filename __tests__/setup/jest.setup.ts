import '@testing-library/jest-native/extend-expect';
import { server } from './msw-server';
import './native-mocks';

// Set env vars used by datasource constructors
process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID = 'test-project';
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost';
process.env.EXPO_PUBLIC_RECONSTRUCTION_API_URL = 'http://localhost:8000';

// MSW: warn on unhandled requests so unit tests (which mock fetch directly) don't break
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
