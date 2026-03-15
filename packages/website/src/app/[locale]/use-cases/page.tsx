import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

const USE_CASES = ["multi-agent-dev", "high-risk-approval", "node-collaboration", "autonomous-revenue-ops"] as const;

const CASE_COPY: Record<
  Locale,
  Record<(typeof USE_CASES)[number], { title: string; description: string; evidence: string; status: "Now" | "In Progress" | "Coming Soon" | "Research" }>
> = {
  en: {
    "multi-agent-dev": {
      title: "Multi-agent development collaboration",
      description: "Coordinate coding, review, and deployment actions under shared trust rules.",
      evidence: "Receipt-linked execution for each delegated step.",
      status: "Now",
    },
    "high-risk-approval": {
      title: "High-risk approval workflow",
      description: "Gate sensitive operations with review queue and explicit human confirmation.",
      evidence: "Audit trail across request, decision, and confirmation.",
      status: "Now",
    },
    "node-collaboration": {
      title: "Node onboarding and cross-boundary execution",
      description: "Connect distributed nodes while preserving policy and governance boundaries.",
      evidence: "Directory sync and traceable invocation origins.",
      status: "Now",
    },
    "autonomous-revenue-ops": {
      title: "Autonomous revenue operations",
      description: "Coordinate pipeline updates, risk checks, and pricing suggestions with policy guardrails.",
      evidence: "Exploration stage for post-MVP growth automation.",
      status: "Research",
    },
  },
  "zh-Hant": {
    "multi-agent-dev": {
      title: "多 Agent 開發協作",
      description: "在共享信任規則下協調編碼、覆核與部署任務。",
      evidence: "每個委派步驟都可對應收據。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高風險動作審批流程",
      description: "敏感操作先進入待確認佇列，再由人工明確確認。",
      evidence: "請求、判定、確認三段皆可稽核追溯。",
      status: "Now",
    },
    "node-collaboration": {
      title: "節點接入與跨邊界協作",
      description: "連接分散節點，同時維持策略與治理邊界。",
      evidence: "目錄同步與調用來源可追蹤。",
      status: "Now",
    },
    "autonomous-revenue-ops": {
      title: "自主營收運營",
      description: "在策略護欄下協調管線更新、風險檢查與定價建議。",
      evidence: "目前為 post-MVP 探索階段。",
      status: "Research",
    },
  },
  "zh-Hans": {
    "multi-agent-dev": {
      title: "多 Agent 开发协作",
      description: "在共享信任规则下协同编码、评审与部署任务。",
      evidence: "每个委派步骤都可关联收据。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高风险动作审批流程",
      description: "敏感操作先进入待确认队列，再由人工明确确认。",
      evidence: "请求、判定、确认三段均可审计追溯。",
      status: "Now",
    },
    "node-collaboration": {
      title: "节点接入与跨边界协作",
      description: "连接分布式节点，同时保持策略与治理边界。",
      evidence: "目录同步与调用来源可追踪。",
      status: "Now",
    },
    "autonomous-revenue-ops": {
      title: "自主营收运营",
      description: "在策略护栏下协同管线更新、风险检查与定价建议。",
      evidence: "当前为 post-MVP 探索阶段。",
      status: "Research",
    },
  },
};

export default async function UseCasesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const copy = dict.useCases;
  const cards = CASE_COPY[locale];

  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {USE_CASES.map((slug) => {
          const item = cards[slug];
          return (
            <Link
              key={slug}
              href={`/${locale}/use-cases/${slug}`}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{item.title}</h2>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
              <p className="mt-3 text-xs text-primary">{item.evidence}</p>
            </Link>
          );
        })}
      </div>

      <CtaLink primary href={`/${locale}/developers`}>
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
