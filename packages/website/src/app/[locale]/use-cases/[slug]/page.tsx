import { notFound } from "next/navigation";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<string, { title: string; description: string; status: "Now" | "In Progress" | "Coming Soon" | "Research" }> = {
  "multi-agent-dev": {
    title: "Multi-agent development collaboration",
    description: "Coordinate code, review, and deployment tasks with auditable invocations.",
    status: "Now",
  },
  "high-risk-approval": {
    title: "High-risk approval workflow",
    description: "Gate risky actions through review queue and human confirmation.",
    status: "Now",
  },
  "node-collaboration": {
    title: "Node onboarding and cross-boundary collaboration",
    description: "Connect node agents while preserving trust and governance boundaries.",
    status: "Now",
  },
  "autonomous-revenue-ops": {
    title: "Autonomous revenue operations",
    description: "This scenario is currently in research; early design focuses on safe growth automation with trust policies.",
    status: "Research",
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
      <div className="flex items-center gap-3">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{item.title}</h1>
        <StatusBadge status={item.status} />
      </div>
      <p className="max-w-3xl text-base text-muted">{item.description}</p>
      {item.status === "Now" ? (
        <CtaLink primary href={`/${locale}/developers`}>
          Start Building
        </CtaLink>
      ) : (
        <CtaLink href={`/${locale}/waitlist`}>Join Waitlist</CtaLink>
      )}
    </section>
  );
}
