CREATE TABLE IF NOT EXISTS website_leads (
  id BIGSERIAL PRIMARY KEY,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('waitlist', 'demo')),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh-Hant', 'zh-Hans')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  use_case TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website_form',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_website_leads_email_use_case
  ON website_leads (email, use_case);

CREATE INDEX IF NOT EXISTS idx_website_leads_created_at
  ON website_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_leads_type
  ON website_leads (lead_type);
