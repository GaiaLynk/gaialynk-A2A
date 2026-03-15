import { CtaLink } from "@/components/cta-link";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).developers;
  const quickstart = {
    en: [
      "Install SDK and configure endpoint",
      "Register agent and policy baseline",
      "Send first trusted invocation",
      "Inspect receipt and audit trail",
    ],
    "zh-Hant": ["安裝 SDK 並設定端點", "註冊 Agent 與基礎策略", "送出首個可信調用", "驗證收據與稽核鏈路"],
    "zh-Hans": ["安装 SDK 并配置端点", "注册 Agent 与基础策略", "发起首个可信调用", "验证收据与审计链路"],
  }[locale];

  const boundaries = {
    en: ["Open Source: core invocation, trust policy, receipt verification", "Cloud roadmap: managed orchestration and enterprise governance"],
    "zh-Hant": ["開源層：核心調用、信任策略、收據驗證", "雲端路線：託管編排與企業治理能力"],
    "zh-Hans": ["开源层：核心调用、信任策略、收据验证", "云端路线：托管编排与企业治理能力"],
  }[locale];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
        <CtaLink
          primary
          href={`/${locale}/docs`}
          eventName="docs_click"
          eventPayload={{ locale, page: "developers", referrer: "internal", cta_id: "read_quickstart" }}
        >
          {copy.primaryCta}
        </CtaLink>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Quickstart</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {quickstart.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">OSS / Cloud Boundary</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {boundaries.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
