import { apiEnvelopeDescription, bearerAuth, paginationParams, standardResponses } from './common';

const formatParam = {
  name: 'format',
  in: 'query' as const,
  description: 'Response format: omit or `json` for API envelope; `csv` or `pdf` downloads a file.',
  schema: { type: 'string', enum: ['json', 'csv', 'pdf'] },
};

export const complianceOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Compliance / Reporting Service',
    version: '1.0.0',
    description: [
      '**Port 4005** · Live reports from PostgreSQL: dashboard summary, stock intake, inspection breakdown, expired units, maintenance history.',
      '',
      apiEnvelopeDescription,
      '',
      'Authenticated users may export CSV/PDF via `?format=`.',
    ].join('\n'),
  },
  tags: [
    { name: 'Health', description: 'Service liveness.' },
    { name: 'Reports', description: 'Aggregated compliance and operational reports.' },
  ],
  servers: [{ url: 'http://localhost:4005', description: 'Compliance service' }],
  components: { securitySchemes: bearerAuth },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        security: [],
        summary: 'Health check',
        responses: { 200: { description: 'Service is up' } },
      },
    },
    '/api/reports/summary': {
      get: {
        tags: ['Reports'],
        summary: 'Dashboard summary',
        description: 'Totals: extinguishers, counts by status/type, expired units, inspection stats.',
        responses: { 200: { description: 'Summary object' }, 401: standardResponses.unauthorized },
      },
    },
    '/api/reports/stock': {
      get: {
        tags: ['Reports'],
        summary: 'Stock intake report',
        description: 'New extinguishers grouped by `?period=daily|monthly|yearly`.',
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'monthly', 'yearly'], default: 'monthly' } },
          formatParam,
        ],
        responses: { 200: { description: 'JSON, CSV, or PDF' } },
      },
    },
    '/api/reports/inspections': {
      get: {
        tags: ['Reports'],
        summary: 'Inspection status breakdown',
        parameters: [formatParam],
        responses: { 200: { description: 'JSON, CSV, or PDF' } },
      },
    },
    '/api/reports/expired': {
      get: {
        tags: ['Reports'],
        summary: 'Expired extinguishers report',
        description: 'Paginated JSON (`format=json` or omitted) or full export as CSV/PDF.',
        parameters: [...paginationParams, formatParam],
        responses: { 200: { description: 'Report data or file download' } },
      },
    },
    '/api/reports/maintenance': {
      get: {
        tags: ['Reports'],
        summary: 'Maintenance history report',
        parameters: [...paginationParams, formatParam],
        responses: { 200: { description: 'Report data or file download' } },
      },
    },
  },
} as const;
