import path from 'path';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { z } from 'zod';
import {
  authOpenApiSpec,
  buildUnifiedOpenApiSpec,
  complianceOpenApiSpec,
  defaultServiceUrls,
  extinguisherOpenApiSpec,
  notificationOpenApiSpec,
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

const serviceUrls = {
  auth: env.AUTH_SERVICE_URL,
  extinguisher: env.EXTINGUISHER_SERVICE_URL,
  notification: env.NOTIFICATION_SERVICE_URL,
  compliance: env.COMPLIANCE_SERVICE_URL,
};

const unifiedSpec = buildUnifiedOpenApiSpec(serviceUrls);

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok', service: 'api-docs-service' }));
});

app.get('/openapi.json', (_req, res) => {
  res.json(unifiedSpec);
});

app.get('/specs/auth.json', (_req, res) => {
  res.json(withServer(authOpenApiSpec, serviceUrls.auth));
});
app.get('/specs/extinguisher.json', (_req, res) => {
  res.json(withServer(extinguisherOpenApiSpec, serviceUrls.extinguisher));
});
app.get('/specs/notification.json', (_req, res) => {
  res.json(withServer(notificationOpenApiSpec, serviceUrls.notification));
});
app.get('/specs/compliance.json', (_req, res) => {
  res.json(withServer(complianceOpenApiSpec, serviceUrls.compliance));
});

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(unifiedSpec, {
    customSiteTitle: 'TWZ Ltd — Unified API Documentation',
    explorer: false,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }),
);

app.get('/', (_req, res) => {
  res.redirect('/docs');
});

app.listen(env.API_DOCS_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Unified API docs: http://localhost:${env.API_DOCS_PORT}/docs`);
});
