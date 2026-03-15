import type { Locale } from "@/lib/i18n/locales";

export type CapabilityStatus = "Now" | "In Progress" | "Coming Soon" | "Research";
export const CAPABILITY_STATUSES: CapabilityStatus[] = ["Now", "In Progress", "Coming Soon", "Research"];

export type VisionTrack = {
  track: string;
  pageModule: string;
  status: CapabilityStatus;
  cta: string;
  productPath: string;
  requiredApiCapabilities: string[];
};

export const PRODUCT_API_CAPABILITIES: Record<string, { status: CapabilityStatus; endpoint: string }> = {
  conversations: { status: "Now", endpoint: "/api/v1/conversations" },
  invocations: { status: "Now", endpoint: "/api/v1/invocations" },
  receipts: { status: "Now", endpoint: "/api/v1/receipts/:id" },
  reviewQueue: { status: "Now", endpoint: "/api/v1/invocations?status=pending_confirmation" },
  nodes: { status: "Now", endpoint: "/api/v1/nodes" },
  managedCloudOrchestration: { status: "In Progress", endpoint: "/api/v1/cloud/orchestration" },
  revenueOpsAutomation: { status: "Research", endpoint: "/api/v1/automation/revenue-ops" },
};

export const VISION_TRACKS_BY_LOCALE: Record<Locale, VisionTrack[]> = {
  en: [
    {
      track: "Developer Co-Building",
      pageModule: "Developers Quickstart + Docs Redirect",
      status: "Now",
      cta: "Start Building",
      productPath: "/en/developers -> /en/docs",
      requiredApiCapabilities: ["conversations", "invocations", "receipts"],
    },
    {
      track: "Enterprise Governance",
      pageModule: "Trust Flow + High-risk Approval Use Case",
      status: "Now",
      cta: "See Trust Flow",
      productPath: "/en/trust -> /en/use-cases/high-risk-approval",
      requiredApiCapabilities: ["reviewQueue", "receipts"],
    },
    {
      track: "Node Collaboration",
      pageModule: "Use Cases Node Collaboration",
      status: "Now",
      cta: "Try This Workflow",
      productPath: "/en/use-cases/node-collaboration",
      requiredApiCapabilities: ["nodes", "invocations"],
    },
    {
      track: "Managed Cloud Orchestration",
      pageModule: "Developers OSS/Cloud Boundary + Waitlist",
      status: "In Progress",
      cta: "Join Waitlist",
      productPath: "/en/waitlist",
      requiredApiCapabilities: ["managedCloudOrchestration"],
    },
    {
      track: "Autonomous Business Ops",
      pageModule: "Use Cases Expansion",
      status: "Research",
      cta: "Book a Demo",
      productPath: "/en/demo",
      requiredApiCapabilities: ["revenueOpsAutomation"],
    },
    {
      track: "Marketplace Ecosystem",
      pageModule: "Future partner and extension surface",
      status: "Coming Soon",
      cta: "Join Waitlist",
      productPath: "/en/waitlist",
      requiredApiCapabilities: [],
    },
  ],
  "zh-Hant": [
    {
      track: "開發者共建工作流",
      pageModule: "Developers 快速開始 + Docs 入口",
      status: "Now",
      cta: "開始構建",
      productPath: "/zh-Hant/developers -> /zh-Hant/docs",
      requiredApiCapabilities: ["conversations", "invocations", "receipts"],
    },
    {
      track: "企業治理與風控",
      pageModule: "Trust 流程 + 高風險審批場景",
      status: "Now",
      cta: "查看信任流程",
      productPath: "/zh-Hant/trust -> /zh-Hant/use-cases/high-risk-approval",
      requiredApiCapabilities: ["reviewQueue", "receipts"],
    },
    {
      track: "節點跨邊界協作",
      pageModule: "Use Cases Node Collaboration",
      status: "Now",
      cta: "試用這個流程",
      productPath: "/zh-Hant/use-cases/node-collaboration",
      requiredApiCapabilities: ["nodes", "invocations"],
    },
    {
      track: "雲端託管編排能力",
      pageModule: "Waitlist + 能力邊界頁",
      status: "In Progress",
      cta: "加入等待名單",
      productPath: "/zh-Hant/waitlist",
      requiredApiCapabilities: ["managedCloudOrchestration"],
    },
    {
      track: "自主業務協作場景",
      pageModule: "Use Cases 擴展",
      status: "Research",
      cta: "預約 Demo",
      productPath: "/zh-Hant/demo",
      requiredApiCapabilities: ["revenueOpsAutomation"],
    },
    {
      track: "生態夥伴市集",
      pageModule: "未來夥伴與擴展能力入口",
      status: "Coming Soon",
      cta: "加入等待名單",
      productPath: "/zh-Hant/waitlist",
      requiredApiCapabilities: [],
    },
  ],
  "zh-Hans": [
    {
      track: "开发者共建工作流",
      pageModule: "Developers 快速开始 + Docs 入口",
      status: "Now",
      cta: "开始构建",
      productPath: "/zh-Hans/developers -> /zh-Hans/docs",
      requiredApiCapabilities: ["conversations", "invocations", "receipts"],
    },
    {
      track: "企业治理与风控",
      pageModule: "Trust 流程 + 高风险审批场景",
      status: "Now",
      cta: "查看信任流程",
      productPath: "/zh-Hans/trust -> /zh-Hans/use-cases/high-risk-approval",
      requiredApiCapabilities: ["reviewQueue", "receipts"],
    },
    {
      track: "节点跨边界协作",
      pageModule: "Use Cases Node Collaboration",
      status: "Now",
      cta: "试用这个流程",
      productPath: "/zh-Hans/use-cases/node-collaboration",
      requiredApiCapabilities: ["nodes", "invocations"],
    },
    {
      track: "云托管编排能力",
      pageModule: "Waitlist + 能力边界页",
      status: "In Progress",
      cta: "加入等待名单",
      productPath: "/zh-Hans/waitlist",
      requiredApiCapabilities: ["managedCloudOrchestration"],
    },
    {
      track: "自主业务协作场景",
      pageModule: "Use Cases 扩展",
      status: "Research",
      cta: "预约 Demo",
      productPath: "/zh-Hans/demo",
      requiredApiCapabilities: ["revenueOpsAutomation"],
    },
    {
      track: "生态伙伴市集",
      pageModule: "未来伙伴与扩展能力入口",
      status: "Coming Soon",
      cta: "加入等待名单",
      productPath: "/zh-Hans/waitlist",
      requiredApiCapabilities: [],
    },
  ],
};

export function getVisionTracks(locale: Locale): VisionTrack[] {
  return VISION_TRACKS_BY_LOCALE[locale];
}
