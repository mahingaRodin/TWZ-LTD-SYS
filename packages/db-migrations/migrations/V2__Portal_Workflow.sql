-- V2: Portal workflow — inspection requests, admin alerts, password change flag

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_request_status') THEN
    CREATE TYPE inspection_request_status AS ENUM ('PENDING', 'REVIEWING', 'DENIED', 'APPROVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_alert_type') THEN
    CREATE TYPE admin_alert_type AS ENUM ('EXPIRY_CRITICAL', 'INSPECTION_REQUEST');
  END IF;
END$$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS inspection_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extinguisher_id UUID                      NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  requested_by    UUID                      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_at    TIMESTAMPTZ               NOT NULL,
  notes           TEXT,
  status          inspection_request_status NOT NULL DEFAULT 'PENDING',
  admin_notes     TEXT,
  inspector_id    UUID                      REFERENCES users(id) ON DELETE SET NULL,
  inspection_id   UUID                      REFERENCES inspections(id) ON DELETE SET NULL,
  reviewed_by     UUID                      REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ               NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_status ON inspection_requests (status);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_user ON inspection_requests (requested_by);

DROP TRIGGER IF EXISTS trg_inspection_requests_updated_at ON inspection_requests;
CREATE TRIGGER trg_inspection_requests_updated_at
  BEFORE UPDATE ON inspection_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS admin_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      admin_alert_type NOT NULL,
  title           TEXT             NOT NULL,
  message         TEXT             NOT NULL,
  extinguisher_id UUID             REFERENCES extinguishers(id) ON DELETE CASCADE,
  request_id      UUID             REFERENCES inspection_requests(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_open ON admin_alerts (acknowledged_at) WHERE acknowledged_at IS NULL;
