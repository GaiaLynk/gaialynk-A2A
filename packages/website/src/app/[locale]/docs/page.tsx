import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { pushAnalyticsEvent } from "@/lib/analytics/store";
import { buildDocsUrl } from "@/lib/config/public";
import type { Locale } from "@/lib/i18n/locales";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const headerStore = await headers();
  const referrer = headerStore.get("referer") || "internal";
  await pushAnalyticsEvent(
    "activation_event",
    buildAnalyticsPayload({
      locale,
      page: "docs_redirect",
      referrer,
      source: "docs_redirect",
    }),
  );
  redirect(buildDocsUrl(locale));
}
