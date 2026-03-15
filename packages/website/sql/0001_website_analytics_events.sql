CREATE TABLE IF NOT EXISTS website_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_received_at
  ON website_analytics_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_locale
  ON website_analytics_events ((payload ->> 'locale'));

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_page
  ON website_analytics_events ((payload ->> 'page'));

CREATE INDEX IF NOT EXISTS idx_website_analytics_events_cta_id
  ON website_analytics_events ((payload ->> 'cta_id'));
