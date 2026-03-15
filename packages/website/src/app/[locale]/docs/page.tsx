import { redirect } from "next/navigation";
import { buildDocsUrl } from "@/lib/config/public";
import type { Locale } from "@/lib/i18n/locales";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(buildDocsUrl(locale));
}
