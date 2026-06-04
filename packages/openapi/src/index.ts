export * from './common';
export { authOpenApiSpec } from './auth.openapi';
export { extinguisherOpenApiSpec } from './extinguisher.openapi';
export { complianceOpenApiSpec } from './compliance.openapi';
export { notificationOpenApiSpec } from './notification.openapi';
export { buildUnifiedOpenApiSpec } from './merged.openapi';

export interface ApiDocsServiceUrls {
  auth: string;
  extinguisher: string;
  notification: string;
  compliance: string;
}

/** Default local development base URLs. */
export const defaultServiceUrls: ApiDocsServiceUrls = {
  auth: 'http://localhost:4001',
  extinguisher: 'http://localhost:4003',
  notification: 'http://localhost:4004',
  compliance: 'http://localhost:4005',
};

export function withServer<T extends Record<string, unknown>>(
  spec: T,
  serverUrl: string,
): T & { servers: { url: string }[] } {
  return { ...spec, servers: [{ url: serverUrl }] };
}

export function swaggerUiUrls(basePath = '') {
  return [
    { url: `${basePath}/specs/auth.json`, name: '1 · Auth Service (4001)' },
    { url: `${basePath}/specs/extinguisher.json`, name: '2 · Extinguisher Service (4003)' },
    { url: `${basePath}/specs/notification.json`, name: '3 · Notification Service (4004)' },
    { url: `${basePath}/specs/compliance.json`, name: '4 · Compliance Service (4005)' },
  ];
}
