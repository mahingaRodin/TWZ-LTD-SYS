import { apiEnvelopeDescription, bearerAuth } from './common';
import { authOpenApiSpec } from './auth.openapi';
import { extinguisherOpenApiSpec } from './extinguisher.openapi';
import { complianceOpenApiSpec } from './compliance.openapi';
import { notificationOpenApiSpec } from './notification.openapi';
import type { ApiDocsServiceUrls } from './index';

type OpenApiDoc = {
  paths: Record<string, unknown>;
  tags?: { name: string; description?: string }[];
  components?: Record<string, unknown>;
};

function prefixTags(spec: OpenApiDoc, prefix: string): OpenApiDoc {
  const tagNames = new Map<string, string>();
  for (const t of spec.tags ?? []) {
    tagNames.set(t.name, `${prefix} — ${t.name}`);
  }

  const paths: Record<string, unknown> = {};
  for (const [path, item] of Object.entries(spec.paths)) {
    const methods = item as Record<string, Record<string, unknown>>;
    const next: Record<string, unknown> = {};
    for (const [method, op] of Object.entries(methods)) {
      const tags = (op.tags as string[] | undefined)?.map((t) => tagNames.get(t) ?? `${prefix} — ${t}`);
      next[method] = { ...op, tags: tags ?? [`${prefix}`] };
    }
    paths[path] = next;
  }

  return {
    paths,
    tags: (spec.tags ?? []).map((t) => ({
      name: tagNames.get(t.name) ?? t.name,
      description: t.description,
    })),
    components: spec.components,
  };
}

/** Single OpenAPI document for the unified docs hub (switch target service via Servers). */
export function buildUnifiedOpenApiSpec(urls: ApiDocsServiceUrls) {
  const auth = prefixTags(authOpenApiSpec as unknown as OpenApiDoc, 'Auth :4001');
  const ext = prefixTags(extinguisherOpenApiSpec as unknown as OpenApiDoc, 'Extinguisher :4003');
  const notif = prefixTags(notificationOpenApiSpec as unknown as OpenApiDoc, 'Notification :4004');
  const comp = prefixTags(complianceOpenApiSpec as unknown as OpenApiDoc, 'Compliance :4005');

  return {
    openapi: '3.0.3',
    info: {
      title: 'TWZ Ltd — Fire Extinguisher System API',
      version: '1.0.0',
      description: [
        '**Unified API documentation** for all microservices.',
        '',
        'Use the **Servers** dropdown (top right) to pick which service to call:',
        '',
        '| Server | Port |',
        '|--------|------|',
        '| Auth | 4001 |',
        '| Extinguisher | 4003 |',
        '| Notification | 4004 |',
        '| Compliance | 4005 |',
        '',
        apiEnvelopeDescription,
      ].join('\n'),
    },
    servers: [
      { url: urls.auth, description: 'Auth service (4001)' },
      { url: urls.extinguisher, description: 'Extinguisher service (4003)' },
      { url: urls.notification, description: 'Notification service (4004)' },
      { url: urls.compliance, description: 'Compliance / reports (4005)' },
    ],
    tags: [...(auth.tags ?? []), ...(ext.tags ?? []), ...(notif.tags ?? []), ...(comp.tags ?? [])],
    paths: {
      ...auth.paths,
      ...ext.paths,
      ...notif.paths,
      ...comp.paths,
    },
    components: {
      securitySchemes: bearerAuth,
    },
  };
}
