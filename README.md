# Fire Extinguisher Lifecycle Management System

A production-ready Node.js monorepo for managing fire extinguisher lifecycle, compliance, and maintenance operations.

## Project Structure

```
fire-extinguisher-pract-tplt/
├── apps/
│   ├── backend/
│   │   ├── auth-service/              # Authentication & User Management (Port 3001)
│   │   ├── customer-service/          # Customer CRUD & Search (Port 3002)
│   │   ├── extinguisher-service/      # Fire Extinguisher Operations (Port 3003)
│   │   ├── notification-service/      # Email, SMS, In-App Notifications (Port 3004)
│   │   └── compliance-service/        # Reports, Escalation, Audit (Port 3005)
│   └── frontend/                       # React + Vite Frontend (Port 3000)
├── packages/
│   ├── shared-types/                  # Shared TypeScript Types
│   ├── shared-constants/              # Shared Constants
│   ├── shared-utils/                  # Shared Utility Functions
│   └── db-migrations/                 # Database Migrations
├── docker-compose.yml                 # PostgreSQL & Redis
├── package.json                       # Root Configuration
├── pnpm-workspace.yaml               # Workspace Configuration
└── tsconfig.json                      # Base TypeScript Configuration
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env
```

### Development

```bash
# Start all services and frontend
pnpm run dev

# Or run services only
pnpm run dev:services

# Or run frontend only
pnpm run dev:frontend
```

### Database Setup

```bash
# Start PostgreSQL and Redis containers
pnpm run db:up

# Run migrations
pnpm run db:migrate
```

### Build

```bash
# Build all packages and services
pnpm run build
```

### Testing

```bash
# Run all tests
pnpm run test
```

### Linting

```bash
# Lint all packages
pnpm run lint
```

## Services Overview

### Auth Service (Port 3001)
- User authentication and authorization
- JWT token management
- OTP generation and verification
- User management endpoints

### Customer Service (Port 3002)
- Customer CRUD operations
- Advanced search and filtering
- Pagination support
- Customer profile management

### Fire Extinguisher Service (Port 3003)
- Fire extinguisher registration
- Maintenance tracking
- Expiry detection and alerts
- Inspection history

### Notification Service (Port 3004)
- Email notifications
- SMS alerts
- In-app notifications
- Notification history and preferences

### Compliance Service (Port 3005)
- Compliance reports generation
- Escalation workflows
- Audit trail maintenance
- Regulatory adherence tracking

## Shared Packages

- **shared-types**: Common TypeScript interfaces and types
- **shared-constants**: Application-wide constants
- **shared-utils**: Reusable utility functions
- **db-migrations**: Database migration scripts

## Environment Configuration

See `.env.example` for all available configuration options:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=fire_extinguisher_system
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching and session management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start all services and frontend |
| `pnpm run dev:services` | Start all backend services |
| `pnpm run dev:frontend` | Start frontend only |
| `pnpm run build` | Build all packages |
| `pnpm run test` | Run all tests |
| `pnpm run lint` | Lint all packages |
| `pnpm run db:migrate` | Run database migrations |
| `pnpm run db:up` | Start Docker containers |

## Health Checks

Each service exposes a health check endpoint:

```bash
curl http://localhost:3001/health    # Auth Service
curl http://localhost:3002/health    # Customer Service
curl http://localhost:3003/health    # Extinguisher Service
curl http://localhost:3004/health    # Notification Service
curl http://localhost:3005/health    # Compliance Service
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Backend**: Express.js
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Validation**: Zod
- **Logging**: Winston
- **State Management**: Redux Toolkit

## Contributing

1. Create a feature branch: `git checkout -b feature/xyz`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/xyz`
4. Create a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
