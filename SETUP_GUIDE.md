# Fire Extinguisher Lifecycle Management System - Setup Guide

## ✅ Monorepo Setup Complete!

All files and directories have been successfully created. Here's what was set up:

### 📦 Created Components

#### Root Configuration (8 files)
- ✓ `package.json` - Root workspace configuration with convenient scripts
- ✓ `pnpm-workspace.yaml` - pnpm workspace definition
- ✓ `tsconfig.json` - Base TypeScript configuration
- ✓ `.npmrc` - npm registry configuration
- ✓ `.gitignore` - Git ignore patterns
- ✓ `docker-compose.yml` - PostgreSQL 16 + Redis 7 containers
- ✓ `.env.example` - Environment variable template
- ✓ `README.md` - Comprehensive documentation

#### Backend Services (5 services × 4 files each = 20 files)
- ✓ Auth Service (Port 3001) - Authentication & User Management
- ✓ Customer Service (Port 3002) - Customer CRUD & Search
- ✓ Extinguisher Service (Port 3003) - Fire Extinguisher Operations
- ✓ Notification Service (Port 3004) - Email, SMS, In-App Notifications
- ✓ Compliance Service (Port 3005) - Reports, Escalation, Audit

Each service includes:
- `package.json` with Express, TypeScript, and shared dependencies
- `tsconfig.json` extending root configuration
- `src/app.ts` - Express application setup
- `src/index.ts` - Server entry point

#### Shared Packages (3 packages × 3 files each = 9 files)
- ✓ shared-types - TypeScript interfaces and types
- ✓ shared-constants - Application constants
- ✓ shared-utils - Utility functions (with zod, winston)

Each includes:
- `package.json` with workspace:* dependency format
- `tsconfig.json` extending root configuration
- `src/index.ts` - Package entry point

#### Frontend (3 files)
- ✓ `package.json` - React 18 + Vite + TailwindCSS setup
- ✓ `vite.config.ts` - Vite configuration for development
- ✓ `tsconfig.json` - React/DOM TypeScript configuration

#### Database (1 file)
- ✓ `db-migrations/package.json` - Flyway migrations setup

---

## 🚀 Getting Started (5 Steps)

### Step 1: Navigate to Project Directory
```bash
cd "C:\Users\user\OneDrive\Desktop\ne_prep\practs_bank\fire_extinguisher_pract_tplt"
```

### Step 2: Install Dependencies
```bash
pnpm install
```
This installs all dependencies for the root, all services, and all packages.

### Step 3: Configure Environment
```bash
# Copy example to .env
cp .env.example .env

# Edit .env as needed (database credentials, JWT secret, etc.)
# Default values are provided for local development
```

### Step 4: Start Docker Containers
```bash
pnpm run db:up
```
This starts PostgreSQL (port 5432) and Redis (port 6379).

### Step 5: Start Development
```bash
# Option A: Start all services and frontend together
pnpm run dev

# Option B: Start backend services only
pnpm run dev:services

# Option C: Start frontend only
pnpm run dev:frontend
```

---

## 📝 Available Commands

### Development
```bash
pnpm run dev              # Start all services + frontend
pnpm run dev:services     # Start all backend services (concurrently)
pnpm run dev:frontend     # Start frontend (Vite dev server)
```

### Building
```bash
pnpm run build            # Build all packages and services
npm run build -w @fire-system/auth-service        # Build specific service
npm run build -w @fire-system/shared-types        # Build specific package
```

### Testing
```bash
pnpm run test             # Run tests in all packages
```

### Linting
```bash
pnpm run lint             # Lint all packages
```

### Database
```bash
pnpm run db:migrate       # Run database migrations (Flyway)
pnpm run db:up            # Start Docker containers
```

### Individual Service Development
```bash
npm run dev -w @fire-system/auth-service
npm run dev -w @fire-system/customer-service
npm run dev -w @fire-system/extinguisher-service
npm run dev -w @fire-system/notification-service
npm run dev -w @fire-system/compliance-service
npm run dev -w @fire-system/frontend
```

---

## 🏥 Health Checks

Once services are running, verify they're responding:

```bash
# Auth Service (Port 3001)
curl http://localhost:3001/health

# Customer Service (Port 3002)
curl http://localhost:3002/health

# Extinguisher Service (Port 3003)
curl http://localhost:3003/health

# Notification Service (Port 3004)
curl http://localhost:3004/health

# Compliance Service (Port 3005)
curl http://localhost:3005/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Service Name"
}
```

---

## 🐳 Docker Containers

### Start Containers
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Stop Containers
```bash
docker-compose down
```

### Remove Containers and Volumes
```bash
docker-compose down -v
```

---

## 📁 Directory Structure Reference

```
fire_extinguisher_pract_tplt/
├── apps/
│   ├── backend/
│   │   ├── auth-service/          [Port 3001]
│   │   ├── customer-service/      [Port 3002]
│   │   ├── extinguisher-service/  [Port 3003]
│   │   ├── notification-service/  [Port 3004]
│   │   └── compliance-service/    [Port 3005]
│   └── frontend/                   [Port 3000]
├── packages/
│   ├── shared-types/
│   ├── shared-constants/
│   ├── shared-utils/
│   └── db-migrations/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── .env.example
├── .gitignore
├── .npmrc
├── README.md
└── DIRECTORY_TREE.md
```

---

## 🔧 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | >=18.0.0 |
| Package Manager | pnpm | >=8.0.0 |
| Language | TypeScript | ^5.2.2 |
| Backend Framework | Express.js | ^4.18.2 |
| Frontend Framework | React | ^18.2.0 |
| Build Tool | Vite | ^5.0.2 |
| Database | PostgreSQL | 16-alpine |
| Cache | Redis | 7-alpine |
| Validation | Zod | ^3.22.4 |
| Logging | Winston | ^3.11.0 |
| State Management | Redux Toolkit | ^1.9.7 |
| Styling | Tailwind CSS | ^3.3.6 |

---

## 📋 Environment Variables

Required environment variables (copy from `.env.example`):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=fire_extinguisher_system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d

# Services
AUTH_SERVICE_URL=http://localhost:3001
CUSTOMER_SERVICE_URL=http://localhost:3002
EXTINGUISHER_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
COMPLIANCE_SERVICE_URL=http://localhost:3005

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

---

## ⚡ Performance Tips

1. **Install pnpm globally**:
   ```bash
   npm install -g pnpm
   ```

2. **Use concurrently for parallel service startup**:
   Already configured in `package.json` scripts.

3. **Redis caching**:
   Services can use Redis for session/cache management.

4. **Database connection pooling**:
   Configure in service `.env` files.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port (Windows)
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### pnpm Dependencies Not Found
```bash
# Reinstall with shamefully-hoist enabled
pnpm install

# Clear cache if issues persist
pnpm store prune
```

### Docker Connection Issues
```bash
# Ensure Docker Desktop is running
# Then:
docker-compose down
docker-compose up -d
```

### TypeScript Compilation Errors
```bash
# Clear dist folders and rebuild
pnpm run build

# Or specific package:
npm run build -w @fire-system/auth-service
```

---

## 📚 Additional Resources

- **README.md** - Comprehensive project documentation
- **DIRECTORY_TREE.md** - Complete directory structure reference
- **pnpm Documentation**: https://pnpm.io/
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **TypeScript**: https://www.typescriptlang.org/

---

## ✨ Next Steps

1. ✅ Run `pnpm install` to install all dependencies
2. ✅ Copy `.env.example` to `.env`
3. ✅ Run `pnpm run db:up` to start Docker containers
4. ✅ Run `pnpm run dev` to start development servers
5. ✅ Visit http://localhost:3000 for frontend
6. ✅ Test APIs at http://localhost:3001-3005

---

## 📞 Support

For questions or issues:
1. Check README.md for detailed documentation
2. Review DIRECTORY_TREE.md for structure reference
3. Ensure all prerequisites are installed (Node.js, pnpm, Docker)
4. Run `pnpm install` again to verify dependencies

---

**Setup completed successfully! 🎉**

Total Created:
- 76 Directories
- 44 Configuration and Source Files
- 5 Backend Microservices
- 1 React Frontend
- 3 Shared Packages
- 1 Database Migration Suite
