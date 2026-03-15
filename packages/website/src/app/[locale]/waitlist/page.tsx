import { LeadForm } from "@/components/lead-form";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export default async function WaitlistPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).waitlist;

  return (
    <section className="space-y-6">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="max-w-3xl text-base text-muted">{copy.description}</p>
      <LeadForm locale={locale} type="waitlist" submitLabel={copy.primaryCta} />
    </section>
  );
}
