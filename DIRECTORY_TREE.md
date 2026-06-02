fire-extinguisher-pract-tplt/
│
├── apps/
│   ├── backend/
│   │   ├── auth-service/
│   │   │   ├── src/
│   │   │   │   ├── config/
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── models/
│   │   │   │   ├── dtos/
│   │   │   │   ├── middleware/
│   │   │   │   ├── utils/
│   │   │   │   ├── app.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── .gitkeep
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   ├── customer-service/          [Same structure as auth-service]
│   │   ├── extinguisher-service/      [Same structure as auth-service]
│   │   ├── notification-service/      [Same structure as auth-service]
│   │   └── compliance-service/        [Same structure as auth-service]
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── common/
│       │   │   ├── layouts/
│       │   │   └── forms/
│       │   ├── pages/
│       │   ├── store/
│       │   │   └── slices/
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── utils/
│       │   ├── styles/
│       │   └── assets/
│       ├── public/
│       │   └── .gitkeep
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   ├── shared-types/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-constants/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-utils/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── db-migrations/
│       ├── migrations/
│       │   └── .gitkeep
│       └── package.json
│
├── .env.example
├── .gitignore
├── .npmrc
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── README.md
├── DIRECTORY_TREE.md (this file)
└── tsconfig.json


=== SERVICE DETAILS ===

Auth Service (Port 3001)
├── Purpose: Authentication, JWT, OTP, user management
├── Health: GET http://localhost:3001/health
└── Entry: src/index.ts

Customer Service (Port 3002)
├── Purpose: Customer CRUD, search, filter, pagination
├── Health: GET http://localhost:3002/health
└── Entry: src/index.ts

Fire Extinguisher Service (Port 3003)
├── Purpose: Registration, maintenance, expiry detection
├── Health: GET http://localhost:3003/health
└── Entry: src/index.ts

Notification Service (Port 3004)
├── Purpose: Email, SMS, in-app notifications
├── Health: GET http://localhost:3004/health
└── Entry: src/index.ts

Compliance Service (Port 3005)
├── Purpose: Reports, escalation, audit trail
├── Health: GET http://localhost:3005/health
└── Entry: src/index.ts

Frontend (Port 3000)
├── Purpose: React + Vite web application
├── Dev Server: npm run dev
└── Build: npm run build


=== SHARED PACKAGES ===

shared-types
├── Purpose: Shared TypeScript types and interfaces
└── Usage: Import common types across all services

shared-constants
├── Purpose: Application-wide constants and enums
└── Usage: Import constants across all services

shared-utils
├── Purpose: Reusable utility functions
├── Dependencies: zod, winston
└── Usage: Import helpers across all services

db-migrations
├── Purpose: Database migration scripts
└── Tool: Flyway


=== WORKSPACE FEATURES ===

✓ pnpm monorepo with workspace support
✓ Root package.json with convenient scripts
✓ Shared TypeScript configuration
✓ Docker Compose for PostgreSQL + Redis
✓ Environment configuration template
✓ Express.js backend services
✓ React + Vite frontend
✓ Shared utilities and types
✓ All directories pre-configured
✓ Git-ready (.gitkeep files in place)


=== QUICK COMMANDS ===

pnpm install                    # Install all dependencies
pnpm run dev                    # Start all services
pnpm run dev:services          # Start backend services only
pnpm run dev:frontend          # Start frontend only
pnpm run build                 # Build all packages
pnpm run test                  # Test all packages
pnpm run lint                  # Lint all packages
pnpm run db:up                 # Start Docker containers
pnpm run db:migrate            # Run database migrations
npm run dev -w @fire-system/auth-service       # Dev single service
npm run build -w @fire-system/shared-types    # Build single package
