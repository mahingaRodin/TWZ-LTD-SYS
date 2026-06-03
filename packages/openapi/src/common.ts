/** Shared OpenAPI components reused across service specs. */

export const bearerAuth = {
  bearerAuth: { type: 'http' as const, scheme: 'bearer', bearerFormat: 'JWT' },
};

export const paginationParams = [
  {
    name: 'page',
    in: 'query' as const,
    description: 'Page number (1-based).',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'pageSize',
    in: 'query' as const,
    description: 'Items per page (max 100).',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
  },
];

export const standardResponses = {
  unauthorized: { description: 'Missing or invalid Bearer token.' },
  forbidden: { description: 'Authenticated but not allowed for this role.' },
  notFound: { description: 'Resource not found.' },
  validationError: { description: 'Request body or query failed validation.' },
};

export const apiEnvelopeDescription =
  'All JSON APIs return `{ success, data?, message?, error? }`. Errors include `error.code` and `error.message`.';
