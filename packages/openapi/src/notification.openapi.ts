import { apiEnvelopeDescription, standardResponses } from './common';

export const notificationOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Notification Service',
    version: '1.0.0',
    description: [
      '**Port 4004** · Internal email gateway for OTP, inspection assignments, and admin notices.',
      '',
      apiEnvelopeDescription,
      '',
      'Not exposed to browsers directly; other services call it server-to-server. If SMTP is unset, emails are logged instead of sent.',
    ].join('\n'),
  },
  tags: [
    { name: 'Health', description: 'Service liveness.' },
    { name: 'Email', description: 'Send transactional email.' },
  ],
  servers: [{ url: 'http://localhost:4004', description: 'Notification service' }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'Service is up' } },
      },
    },
    '/api/notifications/email': {
      post: {
        tags: ['Email'],
        summary: 'Send email',
        description: 'Accepts plain `body` and optional `html`. Returns `{ delivered: boolean }`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'subject', 'body'],
                properties: {
                  to: { type: 'string', format: 'email' },
                  subject: { type: 'string', maxLength: 200 },
                  body: { type: 'string' },
                  html: { type: 'string', description: 'HTML alternative body' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Accepted (delivered or logged)' },
          400: standardResponses.validationError,
        },
      },
    },
  },
} as const;
