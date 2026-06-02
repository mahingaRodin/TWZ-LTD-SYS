import express, { Request, Response } from 'express';
import cors from 'cors';
import { ok } from '@fire-system/shared-utils';
import { authRouter } from './modules/auth/auth.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json(ok({ status: 'ok', service: 'auth-service' }));
});

// API routes
app.use('/api/auth', authRouter);

// 404 + centralized error handling (must be registered last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
