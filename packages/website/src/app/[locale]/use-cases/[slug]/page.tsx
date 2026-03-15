import { notFound } from "next/navigation";
import { CtaLink } from "@/components/cta-link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<string, { title: string; description: string }> = {
  "multi-agent-dev": {
    title: "Multi-agent development collaboration",
    description: "Coordinate code, review, and deployment tasks with auditable invocations.",
  },
  "high-risk-approval": {
    title: "High-risk approval workflow",
    description: "Gate risky actions through review queue and human confirmation.",
  },
  "node-collaboration": {
    title: "Node onboarding and cross-boundary collaboration",
    description: "Connect node agents while preserving trust and governance boundaries.",
  },
};

export function generateStaticParams() {
  return Object.keys(COPY).map((slug) => ({ slug }));
}

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const item = COPY[slug];
  if (!item) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{item.title}</h1>
      <p className="max-w-3xl text-base text-muted">{item.description}</p>
      <CtaLink primary href={`/${locale}/developers`}>
        Start Building
      </CtaLink>
    </section>
  );
}
