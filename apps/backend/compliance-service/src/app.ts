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
import { reportRouter } from './modules/reports/report.routes';
import { logger } from './utils/logger';
import { openApiSpec } from './docs/swagger';

const app = express();

app.use(securityHeaders());
app.use(cors());
app.use(express.json());
app.use(requestLogger(logger));

app.get('/health', (_req: Request, res: Response) => {
  res.json(ok({ status: 'ok', service: 'compliance-service' }));
});
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use('/api/reports', reportRouter);

app.use(notFoundHandler);
app.use(createErrorHandler(logger));

export default app;
