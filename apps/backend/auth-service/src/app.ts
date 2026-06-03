import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import {
  createErrorHandler,
  notFoundHandler,
  ok,
  requestLogger,
  securityHeaders,
} from '@fire-system/shared-utils';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { logger } from './utils/logger';
import { openApiSpec } from './docs/swagger';

const app = express();

// --- Global middleware ------------------------------------------------------
app.use(securityHeaders()); // Helmet security headers
app.use(cors()); // CORS (open by default; restrict origins in production)
app.use(express.json());
app.use(requestLogger(logger)); // one log line per request

// --- Health & API docs ------------------------------------------------------
app.get('/health', (_req: Request, res: Response) => {
  res.json(ok({ status: 'ok', service: 'auth-service' }));
});
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// --- Routes -----------------------------------------------------------------
app.use('/api/auth', authRouter);
app.use('/api/auth/users', usersRouter);

// --- 404 + centralized error handling (must be registered last) -------------
app.use(notFoundHandler);
app.use(createErrorHandler(logger));

export default app;
