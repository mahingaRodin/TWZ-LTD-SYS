import { apiEnvelopeDescription, bearerAuth, paginationParams, standardResponses } from './common';

export const authOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Auth Service',
    version: '1.0.0',
    description: [
      '**Port 4001** · User accounts, JWT access/refresh tokens, OTP email verification, password recovery, and admin user management.',
      '',
      apiEnvelopeDescription,
      '',
      '**Roles:** `ADMIN` · `INSPECTOR` · `USER` (facility manager).',
    ].join('\n'),
  },
  tags: [
    { name: 'Health', description: 'Service liveness.' },
    { name: 'Registration & session', description: 'Public auth flows (register, login, tokens).' },
    { name: 'OTP & passwords', description: 'Email OTP and password reset/change.' },
    { name: 'Profile', description: 'Authenticated user profile.' },
    { name: 'Admin users', description: 'ADMIN-only user CRUD.' },
  ],
  servers: [{ url: 'http://localhost:4001', description: 'Auth service' }],
  components: { securitySchemes: bearerAuth },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns service name and `ok` status. No authentication.',
        responses: { 200: { description: 'Service is up' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Registration & session'],
        summary: 'Register a new account',
        description:
          'Creates a facility-manager account (`USER` role) with `isVerified=false`, stores a hashed email-verification OTP, and triggers an OTP email via the notification service. Login is blocked until OTP verification.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', example: 'Alice' },
                  lastName: { type: 'string', example: 'Tester' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created; verification email sent' },
          409: { description: 'Email already registered' },
          400: standardResponses.validationError,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Registration & session'],
        summary: 'Log in',
        description: 'Issues JWT access token and opaque refresh token. Requires verified email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens and user profile' },
          401: { description: 'Invalid credentials or email not verified' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Registration & session'],
        summary: 'Rotate refresh token',
        description: 'Returns a new access/refresh pair and revokes the previous refresh token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'New token pair' }, 401: { description: 'Invalid or revoked refresh token' } },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Registration & session'],
        summary: 'Logout (revoke refresh token)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Refresh token revoked' } },
      },
    },
    '/api/auth/otp/request': {
      post: {
        tags: ['OTP & passwords'],
        summary: 'Request an OTP',
        description: 'Sends `EMAIL_VERIFICATION` or `PASSWORD_RESET` OTP by email. Always returns 200 if format is valid (no account enumeration).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'purpose'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  purpose: { type: 'string', enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OTP queued (if account exists)' } },
      },
    },
    '/api/auth/otp/verify': {
      post: {
        tags: ['OTP & passwords'],
        summary: 'Verify an OTP',
        description: 'Consumes the OTP. `EMAIL_VERIFICATION` sets `isVerified=true`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'purpose'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  code: { type: 'string', example: '123456' },
                  purpose: { type: 'string', enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OTP accepted' }, 400: { description: 'Invalid or expired code' } },
      },
    },
    '/api/auth/password/reset': {
      post: {
        tags: ['OTP & passwords'],
        summary: 'Reset password with OTP',
        description: 'Requires a valid `PASSWORD_RESET` OTP.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'newPassword'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  code: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password updated' }, 400: { description: 'Invalid OTP' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Profile'],
        summary: 'Get current profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile' }, 401: standardResponses.unauthorized },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { firstName: { type: 'string' }, lastName: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated profile' }, 401: standardResponses.unauthorized },
      },
    },
    '/api/auth/password/change': {
      post: {
        tags: ['OTP & passwords'],
        summary: 'Change password (authenticated)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password changed' }, 401: standardResponses.unauthorized },
      },
    },
    '/api/auth/users': {
      get: {
        tags: ['Admin users'],
        summary: 'List users',
        description: 'Paginated user directory. Optional `?role=ADMIN|INSPECTOR|USER`.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'USER'] } },
          ...paginationParams,
        ],
        responses: { 200: { description: 'Paginated users' }, 403: standardResponses.forbidden },
      },
      post: {
        tags: ['Admin users'],
        summary: 'Create inspector or facility user',
        description: 'ADMIN creates a pre-verified account. Inspector/facility users receive `mustChangePassword=true`.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'role'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['INSPECTOR', 'USER'] },
                },
                description: 'Server assigns the default provisioned password (`user@123`) and sets mustChangePassword.',
              },
            },
          },
        },
        responses: { 201: { description: 'User created' }, 403: standardResponses.forbidden, 409: { description: 'Email exists' } },
      },
    },
    '/api/auth/users/{id}': {
      patch: {
        tags: ['Admin users'],
        summary: 'Update user',
        description: 'Update name, email, role, active flag, or verification. Cannot demote/delete yourself or delete admins.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Updated' }, 403: standardResponses.forbidden, 404: standardResponses.notFound },
      },
      delete: {
        tags: ['Admin users'],
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 403: standardResponses.forbidden, 404: standardResponses.notFound },
      },
    },
  },
} as const;
