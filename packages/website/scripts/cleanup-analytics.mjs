import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const tableName = (process.env.GAIALYNK_ANALYTICS_PG_TABLE || "website_analytics_events").replace(/[^a-zA-Z0-9_]/g, "_");
const leadExportJobsTable = (process.env.GAIALYNK_LEADS_EXPORT_JOBS_PG_TABLE || "website_lead_export_jobs").replace(/[^a-zA-Z0-9_]/g, "_");
const antiAbuseAlertsTable = (process.env.GAIALYNK_ANALYTICS_ALERTS_PG_TABLE || "website_analytics_anti_abuse_alerts").replace(/[^a-zA-Z0-9_]/g, "_");
const retentionDaysRaw = process.env.GAIALYNK_ANALYTICS_RETENTION_DAYS || "30";
const retentionDays = Number.isFinite(Number(retentionDaysRaw)) ? Math.max(1, Math.floor(Number(retentionDaysRaw))) : 30;
const leadJobsRetentionDaysRaw = process.env.GAIALYNK_LEADS_EXPORT_JOBS_RETENTION_DAYS || String(retentionDays);
const leadJobsRetentionDays = Number.isFinite(Number(leadJobsRetentionDaysRaw))
  ? Math.max(1, Math.floor(Number(leadJobsRetentionDaysRaw)))
  : retentionDays;
const alertsRetentionDaysRaw = process.env.GAIALYNK_ANALYTICS_ALERTS_RETENTION_DAYS || String(retentionDays);
const alertsRetentionDays = Number.isFinite(Number(alertsRetentionDaysRaw))
  ? Math.max(1, Math.floor(Number(alertsRetentionDaysRaw)))
  : retentionDays;

if (!databaseUrl) {
  console.error("DATABASE_URL is required for analytics cleanup.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
});

try {
  const result = await pool.query(
    `WITH deleted AS (
      DELETE FROM ${tableName}
      WHERE received_at < NOW() - ($1::text || ' days')::interval
      RETURNING 1
    )
    SELECT COUNT(*)::text AS count FROM deleted;`,
    [retentionDays],
  );

  const jobsResult = await pool.query(
    `WITH deleted AS (
      DELETE FROM ${leadExportJobsTable}
      WHERE created_at < NOW() - ($1::text || ' days')::interval
      RETURNING 1
    )
    SELECT COUNT(*)::text AS count FROM deleted;`,
    [leadJobsRetentionDays],
  );

  const alertsResult = await pool.query(
    `WITH deleted AS (
      DELETE FROM ${antiAbuseAlertsTable}
      WHERE time < NOW() - ($1::text || ' days')::interval
      RETURNING 1
    )
    SELECT COUNT(*)::text AS count FROM deleted;`,
    [alertsRetentionDays],
  );

  console.log(
    `Analytics cleanup completed. events_retention_days=${retentionDays} events_deleted=${result.rows[0]?.count || "0"} leads_export_jobs_retention_days=${leadJobsRetentionDays} leads_export_jobs_deleted=${jobsResult.rows[0]?.count || "0"} anti_abuse_alerts_retention_days=${alertsRetentionDays} anti_abuse_alerts_deleted=${alertsResult.rows[0]?.count || "0"}`,
  );
} catch (error) {
  console.error("Failed to cleanup analytics events.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
