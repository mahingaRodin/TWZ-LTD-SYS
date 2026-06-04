-- V3: Inspector due-soon alerts for scheduled inspections with no outcome

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspector_alert_type') THEN
    CREATE TYPE inspector_alert_type AS ENUM ('INSPECTION_DUE_SOON');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS inspector_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      inspector_alert_type NOT NULL DEFAULT 'INSPECTION_DUE_SOON',
  title           TEXT                 NOT NULL,
  message         TEXT                 NOT NULL,
  inspection_id   UUID                 NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  inspector_id    UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ          NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspector_alerts_inspector_open
  ON inspector_alerts (inspector_id)
  WHERE acknowledged_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inspector_alerts_open_inspection
  ON inspector_alerts (inspection_id)
  WHERE acknowledged_at IS NULL;
