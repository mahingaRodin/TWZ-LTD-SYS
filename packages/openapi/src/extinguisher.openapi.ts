import { apiEnvelopeDescription, bearerAuth, paginationParams, standardResponses } from './common';

export const extinguisherOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Extinguisher Service',
    version: '1.0.0',
    description: [
      '**Port 4003** · Extinguisher registry, inspections, maintenance logs, facility inspection requests, and admin alerts.',
      '',
      apiEnvelopeDescription,
      '',
      'All routes require `Authorization: Bearer <accessToken>` unless noted.',
    ].join('\n'),
  },
  tags: [
    { name: 'Health', description: 'Service liveness.' },
    { name: 'Extinguishers', description: 'Unit registry CRUD and search.' },
    { name: 'Inspections', description: 'Schedule and complete field inspections (ADMIN/INSPECTOR).' },
    { name: 'Maintenance', description: 'Maintenance visit logs.' },
    { name: 'Inspection requests', description: 'Facility USER requests → ADMIN approval workflow.' },
    { name: 'Admin alerts', description: 'Banner alerts for admins (expiry, new requests).' },
  ],
  servers: [{ url: 'http://localhost:4003', description: 'Extinguisher service' }],
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
    '/api/extinguishers': {
      get: {
        tags: ['Extinguishers'],
        summary: 'List extinguishers',
        description: 'Paginated list with optional `status`, `type`, and `search` (serial/location).',
        parameters: [
          ...paginationParams,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'MAINTENANCE', 'DECOMMISSIONED'] } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated extinguishers' }, 401: standardResponses.unauthorized },
      },
      post: {
        tags: ['Extinguishers'],
        summary: 'Register extinguisher',
        description: '**ADMIN only.** Creates a new unit in the fleet.',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' }, 403: standardResponses.forbidden, 409: { description: 'Duplicate serial' } },
      },
    },
    '/api/extinguishers/{id}': {
      get: {
        tags: ['Extinguishers'],
        summary: 'Get extinguisher by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Extinguisher' }, 404: standardResponses.notFound },
      },
      put: {
        tags: ['Extinguishers'],
        summary: 'Update extinguisher',
        description: '**ADMIN only.**',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Updated' }, 403: standardResponses.forbidden },
      },
      delete: {
        tags: ['Extinguishers'],
        summary: 'Delete extinguisher',
        description: '**ADMIN only.**',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 403: standardResponses.forbidden },
      },
    },
    '/api/inspections/stats': {
      get: {
        tags: ['Inspections'],
        summary: 'Inspection dashboard stats',
        description: 'Counts for ongoing, completed, passed, failed. Use `?assignedToMe=true` for inspector scope.',
        parameters: [{ name: 'assignedToMe', in: 'query', schema: { type: 'boolean' } }],
        responses: { 200: { description: 'Stats object' }, 403: standardResponses.forbidden },
      },
    },
    '/api/inspections': {
      get: {
        tags: ['Inspections'],
        summary: 'List inspections',
        description: '**ADMIN/INSPECTOR only.** Paginated; filter by `status`, `result`, `extinguisherId`, `assignedToMe`.',
        parameters: [
          ...paginationParams,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] } },
          { name: 'result', in: 'query', schema: { type: 'string', enum: ['PASS', 'FAIL'] } },
          { name: 'extinguisherId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'assignedToMe', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Paginated inspections' }, 403: standardResponses.forbidden },
      },
      post: {
        tags: ['Inspections'],
        summary: 'Schedule inspection',
        description: '**ADMIN only.** Creates `SCHEDULED` inspection and emails the assigned inspector.',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Scheduled' }, 403: standardResponses.forbidden },
      },
    },
    '/api/inspections/{id}': {
      get: {
        tags: ['Inspections'],
        summary: 'Get inspection by id',
        description: '**ADMIN/INSPECTOR only.**',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Inspection' }, 403: standardResponses.forbidden },
      },
    },
    '/api/inspections/{id}/complete': {
      post: {
        tags: ['Inspections'],
        summary: 'Complete inspection (PASS/FAIL)',
        description: '**ADMIN or INSPECTOR.** Sets status `COMPLETED` and records result.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Completed' }, 400: { description: 'Not in SCHEDULED state' } },
      },
    },
    '/api/inspections/{id}/cancel': {
      post: {
        tags: ['Inspections'],
        summary: 'Cancel inspection',
        description: '**ADMIN or INSPECTOR.**',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Cancelled' } },
      },
    },
    '/api/maintenance': {
      get: {
        tags: ['Maintenance'],
        summary: 'List maintenance logs',
        description: 'Paginated. Inspectors may use `performedByMe=true` to see only their logs.',
        parameters: [...paginationParams, { name: 'performedByMe', in: 'query', schema: { type: 'boolean' } }],
        responses: { 200: { description: 'Paginated logs' } },
      },
      post: {
        tags: ['Maintenance'],
        summary: 'Log maintenance',
        description: '**ADMIN or INSPECTOR.** Records action taken on a unit.',
        responses: { 201: { description: 'Logged' }, 403: standardResponses.forbidden },
      },
    },
    '/api/inspection-requests/stats': {
      get: {
        tags: ['Inspection requests'],
        summary: 'Request dashboard stats',
        description: 'ADMIN sees all requests; USER sees only their own counts.',
        responses: { 200: { description: 'pending/reviewing/approved/denied/total' } },
      },
    },
    '/api/inspection-requests': {
      get: {
        tags: ['Inspection requests'],
        summary: 'List inspection requests',
        description: 'ADMIN: all requests (optional `?status=`). USER: **only own** requests and linked pass/fail outcomes.',
        parameters: [
          ...paginationParams,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'REVIEWING', 'DENIED', 'APPROVED'] } },
        ],
        responses: { 200: { description: 'Paginated requests with optional inspection outcome fields' } },
      },
      post: {
        tags: ['Inspection requests'],
        summary: 'Submit inspection request',
        description: '**USER only.** Notifies admins via email and creates an admin alert.',
        responses: { 201: { description: 'Request submitted' }, 403: standardResponses.forbidden },
      },
    },
    '/api/inspection-requests/{id}': {
      get: {
        tags: ['Inspection requests'],
        summary: 'Get request by id',
        description: 'USER may only fetch **their own** request (includes inspection outcome when completed).',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Request' }, 403: standardResponses.forbidden, 404: standardResponses.notFound },
      },
    },
    '/api/inspection-requests/{id}/acknowledge-alert': {
      post: {
        tags: ['Inspection requests'],
        summary: 'Acknowledge related admin alert',
        description: '**ADMIN.** Clears banner alert when reviewing a request.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Acknowledged' } },
      },
    },
    '/api/inspection-requests/{id}/review': {
      patch: {
        tags: ['Inspection requests'],
        summary: 'Review request (approve/deny)',
        description:
          '**ADMIN.** `APPROVED` requires `inspectorId` + `scheduledAt` and creates a linked inspection. `DENIED` stores admin notes.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Updated request' } },
      },
    },
    '/api/alerts': {
      get: {
        tags: ['Admin alerts'],
        summary: 'List open admin alerts',
        description: '**ADMIN.** Unacknowledged expiry and inspection-request alerts.',
        responses: { 200: { description: 'Alert array' } },
      },
    },
    '/api/alerts/{id}/acknowledge': {
      post: {
        tags: ['Admin alerts'],
        summary: 'Acknowledge alert',
        description: '**ADMIN.** Dismisses a banner alert by id.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Acknowledged' } },
      },
    },
  },
} as const;
