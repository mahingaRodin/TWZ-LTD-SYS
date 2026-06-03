import path from 'path';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { z } from 'zod';
import {
  authOpenApiSpec,
  complianceOpenApiSpec,
  defaultServiceUrls,
  extinguisherOpenApiSpec,
  notificationOpenApiSpec,
  swaggerUiUrls,
  withServer,
} from '@fire-system/openapi';
import { ok } from '@fire-system/shared-utils';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  API_DOCS_PORT: z.coerce.number().default(4010),
  AUTH_SERVICE_URL: z.string().url().default(defaultServiceUrls.auth),
  EXTINGUISHER_SERVICE_URL: z.string().url().default(defaultServiceUrls.extinguisher),
  NOTIFICATION_SERVICE_URL: z.string().url().default(defaultServiceUrls.notification),
  COMPLIANCE_SERVICE_URL: z.string().url().default(defaultServiceUrls.compliance),
});

const env = envSchema.parse(process.env);

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok', service: 'api-docs-service' }));
});

app.get('/specs/auth.json', (_req, res) => {
  res.json(withServer(authOpenApiSpec, env.AUTH_SERVICE_URL));
});
app.get('/specs/extinguisher.json', (_req, res) => {
  res.json(withServer(extinguisherOpenApiSpec, env.EXTINGUISHER_SERVICE_URL));
});
app.get('/specs/notification.json', (_req, res) => {
  res.json(withServer(notificationOpenApiSpec, env.NOTIFICATION_SERVICE_URL));
});
app.get('/specs/compliance.json', (_req, res) => {
  res.json(withServer(complianceOpenApiSpec, env.COMPLIANCE_SERVICE_URL));
});

const swaggerUrls = swaggerUiUrls('');

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    customSiteTitle: 'TWZ Ltd — API Documentation',
    swaggerOptions: {
      urls: swaggerUrls,
      'urls.primaryName': '1 · Auth Service (4001)',
      docExpansion: 'list',
      filter: true,
      persistAuthorization: true,
    },
  }),
);

app.get('/', (_req, res) => {
  res.redirect('/docs');
});

app.listen(env.API_DOCS_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API docs hub: http://localhost:${env.API_DOCS_PORT}/docs`);
});
