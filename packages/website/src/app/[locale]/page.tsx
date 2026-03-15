import { CtaLink } from "@/components/cta-link";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const home = dict.home;

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative space-y-7">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{home.eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">{home.title}</h1>
          <p className="max-w-3xl text-base text-muted md:text-lg">{home.description}</p>
          <div className="flex flex-wrap gap-3">
            <CtaLink
              primary
              href={`/${locale}/developers`}
              eventName="cta_click"
              eventPayload={{
                locale,
                page: "home",
                referrer: "internal",
                cta_id: "start_building",
              }}
            >
              {home.primaryCta}
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {home.valuePoints.map((point, index) => (
          <div key={point} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-primary">0{index + 1}</p>
            <p className="mt-3 text-sm text-foreground">{point}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 rounded-2xl border border-border bg-gradient-to-b from-card to-background p-7 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{home.evidenceTitle}</h2>
          <p className="max-w-3xl text-muted">{home.evidenceDescription}</p>
        </div>
        <div className="grid gap-3">
          {home.evidencePoints.map((point) => (
            <div key={point} className="rounded-lg border border-border p-4 text-sm text-muted">
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <p className="text-sm text-muted">Need a guided onboarding path? Choose a secondary route.</p>
        <div className="flex flex-wrap gap-3">
          <CtaLink
            href={`/${locale}/demo`}
            eventName="demo_click"
            eventPayload={{
              locale,
              page: "home",
              referrer: "internal",
              cta_id: "book_demo",
            }}
          >
            {home.secondaryCtas.demo}
          </CtaLink>
          <CtaLink
            href={`/${locale}/waitlist`}
            eventName="cta_click"
            eventPayload={{
              locale,
              page: "home",
              referrer: "internal",
              cta_id: "join_waitlist",
            }}
          >
            {home.secondaryCtas.waitlist}
          </CtaLink>
        </div>
      </section>
    </div>
  );
}
