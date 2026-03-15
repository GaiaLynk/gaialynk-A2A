CREATE TABLE IF NOT EXISTS website_lead_export_jobs (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  format TEXT NOT NULL CHECK (format IN ('json', 'csv')),
  filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  csv_content TEXT,
  records JSONB
);

CREATE INDEX IF NOT EXISTS idx_website_lead_export_jobs_created_at ON website_lead_export_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_lead_export_jobs_status_created_at ON website_lead_export_jobs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS website_analytics_anti_abuse_alerts (
  id BIGSERIAL PRIMARY KEY,
  time TIMESTAMPTZ NOT NULL,
  ip TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  path TEXT NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  severity TEXT NOT NULL CHECK (severity IN ('warn', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_website_anti_abuse_alerts_time ON website_analytics_anti_abuse_alerts (time DESC);
CREATE INDEX IF NOT EXISTS idx_website_anti_abuse_alerts_severity_time ON website_analytics_anti_abuse_alerts (severity, time DESC);
