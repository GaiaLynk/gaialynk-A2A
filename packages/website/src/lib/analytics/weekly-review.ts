import type { Locale } from "../i18n/locales";
import type { FunnelSnapshot } from "./funnel";

type BuildWeeklyReviewInput = {
  locale: Locale | "all";
  generatedAt: string;
  snapshot: FunnelSnapshot;
};

function renderAlertLines(snapshot: FunnelSnapshot): string {
  if (!snapshot.alerts.length) {
    return "- None";
  }
  return snapshot.alerts.map((item) => `- ${item.code} (${item.currentPct}% / threshold ${item.thresholdPct}%)`).join("\n");
}

function renderLocaleGapAlertLines(snapshot: FunnelSnapshot): string {
  if (!snapshot.localeGapAlerts.length) {
    return "- None";
  }
  return snapshot.localeGapAlerts
    .map((item) => `- ${item.code} (${item.bestLocale} -> ${item.worstLocale}, gap ${item.gapPct}%, threshold ${item.thresholdPct}%)`)
    .join("\n");
}

function renderLocaleDiagnosticsTable(snapshot: FunnelSnapshot): string {
  const rows = snapshot.localeDiagnostics
    .map((item) => `| ${item.locale} | ${item.homeViews} | ${item.startBuildingCtr}% | ${item.submitRate}% | ${item.suspectedTrafficSharePct}% |`)
    .join("\n");
  return [
    "| Locale | Home Views | Start Building CTR | Submit Rate | Suspected Share |",
    "| --- | ---: | ---: | ---: | ---: |",
    rows,
  ].join("\n");
}

export function buildWeeklyReviewMarkdown(input: BuildWeeklyReviewInput): string {
  const submitRate = Number((input.snapshot.rates.demoConversionRate + input.snapshot.rates.waitlistConversionRate).toFixed(2));
  return [
    "## Website Entry Weekly Review Snapshot",
    "",
    `- Generated at: ${input.generatedAt || "N/A"}`,
    `- Locale scope: ${input.locale}`,
    `- Last 24h events: ${input.snapshot.last24hEvents}`,
    "",
    "### Core Funnel",
    `- Home views: ${input.snapshot.counts.homeViews}`,
    `- Start Building CTR: ${input.snapshot.rates.startBuildingCtr}%`,
    `- Activation completion rate (docs -> activation): ${input.snapshot.rates.activationCompletionRate}%`,
    `- Submit rate (demo + waitlist): ${submitRate}%`,
    `- Suspected traffic share: ${input.snapshot.suspectedTrafficSharePct}%`,
    "",
    "### Funnel Alerts",
    renderAlertLines(input.snapshot),
    "",
    "### Locale Diagnostics",
    renderLocaleDiagnosticsTable(input.snapshot),
    "",
    "### Locale Gap Alerts",
    renderLocaleGapAlertLines(input.snapshot),
    "",
    "### Next Actions",
    "- Keep: ",
    "- Change: ",
    "- Experiment: ",
  ].join("\n");
}
