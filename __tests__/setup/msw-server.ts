import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth.handlers';
import { scanHandlers } from './handlers/scan.handlers';
import { reconstructionHandlers } from './handlers/reconstruction.handlers';
import { localizationHandlers } from './handlers/localization.handlers';

export const server = setupServer(
  ...authHandlers,
  ...scanHandlers,
  ...reconstructionHandlers,
  ...localizationHandlers,
);
