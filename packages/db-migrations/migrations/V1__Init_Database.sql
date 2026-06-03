-- =============================================================================
-- V1: Initial database schema
-- Fire Extinguisher Lifecycle Management System (TWZ Ltd)
--
-- All microservices share this one database (fire_extinguisher_system).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'INSPECTOR', 'USER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'otp_purpose') THEN
    CREATE TYPE otp_purpose AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extinguisher_type') THEN
    CREATE TYPE extinguisher_type AS ENUM ('WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extinguisher_size') THEN
    CREATE TYPE extinguisher_size AS ENUM ('2.5lbs', '5lbs', '9lbs', '12lbs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extinguisher_status') THEN
    CREATE TYPE extinguisher_status AS ENUM ('ACTIVE', 'EXPIRED', 'MAINTENANCE', 'DECOMMISSIONED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
    CREATE TYPE inspection_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_result') THEN
    CREATE TYPE inspection_result AS ENUM ('PASS', 'FAIL');
  END IF;
END$$;

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'USER',
  is_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness without depending on the CITEXT extension.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- otp_codes (email verification + password reset)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT        NOT NULL,
  purpose     otp_purpose NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_codes (user_id, purpose);

-- ----------------------------------------------------------------------------
-- refresh_tokens
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens (user_id);

-- ----------------------------------------------------------------------------
-- extinguishers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS extinguishers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number     TEXT                 NOT NULL UNIQUE,
  location          TEXT                 NOT NULL,
  type              extinguisher_type    NOT NULL,
  size              extinguisher_size    NOT NULL,
  installation_date DATE                 NOT NULL,
  expiry_date       DATE                 NOT NULL,
  status            extinguisher_status  NOT NULL DEFAULT 'ACTIVE',
  created_by        UUID                 REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ          NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_extinguishers_status ON extinguishers (status);
CREATE INDEX IF NOT EXISTS idx_extinguishers_expiry ON extinguishers (expiry_date);

DROP TRIGGER IF EXISTS trg_extinguishers_updated_at ON extinguishers;
CREATE TRIGGER trg_extinguishers_updated_at
  BEFORE UPDATE ON extinguishers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- inspections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extinguisher_id UUID               NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ        NOT NULL,
  inspector_id    UUID               REFERENCES users(id) ON DELETE SET NULL,
  status          inspection_status  NOT NULL DEFAULT 'SCHEDULED',
  result          inspection_result,
  notes           TEXT,
  created_by      UUID               REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inspections_extinguisher ON inspections (extinguisher_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections (status);

DROP TRIGGER IF EXISTS trg_inspections_updated_at ON inspections;
CREATE TRIGGER trg_inspections_updated_at
  BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- maintenance_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extinguisher_id UUID        NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  action_taken    TEXT        NOT NULL,
  action_date     DATE        NOT NULL,
  condition_noted TEXT,
  performed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_extinguisher ON maintenance_logs (extinguisher_id);
