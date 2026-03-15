import { CtaLink } from "@/components/cta-link";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export default async function TrustPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).trust;

  const riskLevels = {
    en: ["low: auto-allow with audit", "medium: policy-based review", "high: mandatory human confirmation"],
    "zh-Hant": ["low：自動放行並記錄稽核", "medium：依策略進入覆核", "high：必須人工確認"],
    "zh-Hans": ["low：自动放行并记录审计", "medium：按策略进入复核", "high：必须人工确认"],
  }[locale];

  const trustFlow = {
    en: ["Invocation requested", "Policy decision", "Review queue (if high-risk)", "Receipt signed", "Audit trail retained"],
    "zh-Hant": ["發起調用請求", "策略判定", "高風險進入待確認佇列", "收據簽名", "稽核鏈路留存"],
    "zh-Hans": ["发起调用请求", "策略判定", "高风险进入待确认队列", "收据签名", "审计链路留存"],
  }[locale];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
        <CtaLink primary href={`/${locale}/use-cases/high-risk-approval`}>
          {copy.primaryCta}
        </CtaLink>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Risk Levels</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {riskLevels.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Trust Flow</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted">
            {trustFlow.map((item, index) => (
              <li key={item}>
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
