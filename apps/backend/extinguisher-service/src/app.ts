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
import { extinguisherRouter } from './modules/extinguisher/extinguisher.routes';
import { inspectionRouter } from './modules/inspection/inspection.routes';
import { maintenanceRouter } from './modules/maintenance/maintenance.routes';
import { inspectionRequestRouter } from './modules/inspection-request/inspection-request.routes';
import { alertRouter } from './modules/alerts/alert.routes';
import { inspectorAlertRouter } from './modules/alerts/inspector-alert.routes';
import { logger } from './utils/logger';
import { openApiSpec } from './docs/swagger';

const app = express();

app.use(securityHeaders());
app.use(cors());
app.use(express.json());
app.use(requestLogger(logger));

app.get('/health', (_req: Request, res: Response) => {
  res.json(ok({ status: 'ok', service: 'extinguisher-service' }));
});
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use('/api/extinguishers', extinguisherRouter);
app.use('/api/inspections', inspectionRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/inspection-requests', inspectionRequestRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/inspector-alerts', inspectorAlertRouter);

app.use(notFoundHandler);
app.use(createErrorHandler(logger));

export default app;
