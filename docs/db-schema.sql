CREATE TABLE users (
  id            UUID PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL,
  is_verified   BOOLEAN NOT NULL,
  is_active     BOOLEAN NOT NULL,
  must_change_password BOOLEAN NOT NULL,
  created_at    TIMESTAMP NOT NULL,
  updated_at    TIMESTAMP NOT NULL
);

CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL,
  code_hash   TEXT NOT NULL,
  purpose     VARCHAR(30) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP,
  created_at  TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE extinguishers (
  id                UUID PRIMARY KEY,
  serial_number     TEXT NOT NULL UNIQUE,
  location          TEXT NOT NULL,
  type              VARCHAR(20) NOT NULL,
  size              VARCHAR(10) NOT NULL,
  installation_date DATE NOT NULL,
  expiry_date       DATE NOT NULL,
  status            VARCHAR(20) NOT NULL,
  created_by        UUID,
  created_at        TIMESTAMP NOT NULL,
  updated_at        TIMESTAMP NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE inspections (
  id              UUID PRIMARY KEY,
  extinguisher_id UUID NOT NULL,
  scheduled_at    TIMESTAMP NOT NULL,
  inspector_id    UUID,
  status          VARCHAR(20) NOT NULL,
  result          VARCHAR(10),
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL,
  FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id),
  FOREIGN KEY (inspector_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE maintenance_logs (
  id              UUID PRIMARY KEY,
  extinguisher_id UUID NOT NULL,
  action_taken    TEXT NOT NULL,
  action_date     DATE NOT NULL,
  condition_noted TEXT,
  performed_by    UUID,
  created_at      TIMESTAMP NOT NULL,
  FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE inspection_requests (
  id              UUID PRIMARY KEY,
  extinguisher_id UUID NOT NULL,
  requested_by    UUID NOT NULL,
  preferred_at    TIMESTAMP NOT NULL,
  notes           TEXT,
  status          VARCHAR(20) NOT NULL,
  admin_notes     TEXT,
  inspector_id    UUID,
  inspection_id   UUID,
  reviewed_by     UUID,
  created_at      TIMESTAMP NOT NULL,
  updated_at      TIMESTAMP NOT NULL,
  FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (inspector_id) REFERENCES users(id),
  FOREIGN KEY (inspection_id) REFERENCES inspections(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE admin_alerts (
  id              UUID PRIMARY KEY,
  alert_type      VARCHAR(30) NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  extinguisher_id UUID,
  request_id      UUID,
  acknowledged_at TIMESTAMP,
  created_at      TIMESTAMP NOT NULL,
  FOREIGN KEY (extinguisher_id) REFERENCES extinguishers(id),
  FOREIGN KEY (request_id) REFERENCES inspection_requests(id)
);
