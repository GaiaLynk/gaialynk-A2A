# GAIALYNK 

Phase 0 最小交付聚焦可信调用闭环：

- 会话与消息流
- Agent 目录与加入会话
- A2A 调用映射（支持 `mock://` 与 JSON-RPC 外部端点）
- Trust Policy v0（allow / need_confirmation / deny）
- 审计事件与收据验签
- Node-Hub 最小接口（register / heartbeat / directory sync）
- 高风险 Review Queue（pending invocation 列表 + 人审确认）
- 多 Agent 定向调用（单条消息触发多个 Agent）
- go/no-go 指标聚合与控制台可视化
- 极简控制台（本地静态页面）

## 快速开始

```bash
npm install
npm run dev:server
```

服务启动后：

- API: `http://localhost:3000`
- 控制台（新终端）:

```bash
npm run dev:console
```

打开浏览器访问 `http://localhost:5173`

## Docker 一键启动

```bash
docker compose up --build
```

启动后 API 可通过 `http://localhost:3000` 访问。

## 测试

```bash
npm test
npm run typecheck
```

官网入口（Phase 1）开发与构建：

```bash
npm run dev:website
npm run typecheck:website
npm run build:website
```

可选环境变量：

- `NEXT_PUBLIC_SITE_URL`：站点公开域名（用于 sitemap/robots）
- `NEXT_PUBLIC_DOCS_URL`：文档入口地址（`/[locale]/docs` 会自动附带 UTM）
- `NEXT_PUBLIC_POSTHOG_KEY`：PostHog 项目 key（可选）
- `NEXT_PUBLIC_POSTHOG_HOST`：PostHog Host（默认 `https://app.posthog.com`）
- `GAIALYNK_ANALYTICS_STORE`：事件存储驱动（`memory` 或 `file`，默认 `memory`）
- `GAIALYNK_ANALYTICS_FILE`：当驱动为 `file` 时的存储文件（默认 `.data/analytics-events.json`）
- `GAIALYNK_ANALYTICS_STORE=postgres`：启用 PostgreSQL 事件持久化（需 `DATABASE_URL`）
- `GAIALYNK_ANALYTICS_PG_TABLE`：PostgreSQL 表名（默认 `website_analytics_events`）
- `GAIALYNK_ANALYTICS_RETENTION_DAYS`：清理脚本保留天数（默认 30）
- `GAIALYNK_ANALYTICS_HEALTH_KEY`：`/api/analytics/health` 鉴权密钥（必填才可用）
- `GAIALYNK_ANALYTICS_ALERT_MAX_IDLE_SECONDS`：健康检查最大允许空闲秒数（默认 900）
- `GAIALYNK_ANALYTICS_ALERT_MIN_EVENTS_24H`：健康检查 24h 最低事件量阈值（默认 1）
- `GAIALYNK_ANALYTICS_ALERT_MIN_START_BUILDING_CTR_PCT`：漏斗告警最小 CTR 阈值（默认 8）
- `GAIALYNK_ANALYTICS_ALERT_MIN_SUBMIT_RATE_PCT`：漏斗告警最小提交率阈值（默认 2）
- `GAIALYNK_ANALYTICS_ALERT_MAX_SUSPECTED_TRAFFIC_SHARE_PCT`：漏斗告警最大可疑流量占比阈值（默认 35）
- `GAIALYNK_ANALYTICS_LOCALE_GAP_MIN_CTR_PCT`：多语 CTR 差异告警阈值（默认 15）
- `GAIALYNK_ANALYTICS_LOCALE_GAP_MIN_SUBMIT_RATE_PCT`：多语提交率差异告警阈值（默认 5）
- `GAIALYNK_ANALYTICS_LOCALE_GAP_MIN_SUSPECTED_SHARE_PCT`：多语可疑流量差异告警阈值（默认 10）
- `GAIALYNK_ANALYTICS_RATE_LIMIT_SOFT_PER_MIN`：埋点软限流阈值（默认 60）
- `GAIALYNK_ANALYTICS_RATE_LIMIT_HARD_PER_MIN`：埋点硬限流阈值（默认 180）
- `GAIALYNK_ANALYTICS_MIN_DWELL_MS`：最小停留阈值（默认 1200ms）
- `GAIALYNK_ANALYTICS_TRUSTED_SOURCES`：反滥用白名单 source（逗号分隔）
- `GAIALYNK_ANALYTICS_TRUSTED_IPS`：反滥用白名单 IP（逗号分隔）
- `GAIALYNK_ANALYTICS_ALERTS_STORE`：anti-abuse 告警存储驱动（默认跟随 `GAIALYNK_ANALYTICS_STORE`）
- `GAIALYNK_ANALYTICS_ALERTS_FILE`：anti-abuse 告警 file 路径（默认 `.data/analytics-anti-abuse-alerts.json`）
- `GAIALYNK_ANALYTICS_ALERTS_PG_TABLE`：anti-abuse 告警 postgres 表名（默认 `website_analytics_anti_abuse_alerts`）
- `GAIALYNK_ANALYTICS_ALERTS_RETENTION_DAYS`：anti-abuse 告警保留天数（默认跟随 analytics retention）
- `GAIALYNK_LEADS_STORE`：lead 存储驱动（`memory`/`file`/`postgres`）
- `GAIALYNK_LEADS_FILE`：lead file 驱动路径（默认 `.data/leads.json`）
- `GAIALYNK_LEADS_PG_TABLE`：lead postgres 表名（默认 `website_leads`）
- `GAIALYNK_LEADS_EXPORT_JOBS_STORE`：导出任务存储驱动（默认跟随 `GAIALYNK_LEADS_STORE`）
- `GAIALYNK_LEADS_EXPORT_JOBS_FILE`：导出任务 file 路径（默认 `.data/leads-export-jobs.json`）
- `GAIALYNK_LEADS_EXPORT_JOBS_PG_TABLE`：导出任务 postgres 表名（默认 `website_lead_export_jobs`）
- `GAIALYNK_LEADS_EXPORT_JOBS_RETENTION_DAYS`：导出任务保留天数（默认跟随 analytics retention）
- `GAIALYNK_LEADS_EXPORT_KEY`：`/api/lead/export` 鉴权密钥

分析接口（MVP）：

- `POST /api/analytics/events`：接收前端事件
- `GET /api/analytics/funnel?locale=all|en|zh-Hant|zh-Hans`：返回漏斗快照与 Top 页面/CTA
- `GET /api/analytics/health`：受保护健康检查（Header 需带密钥，可选 `?probe=dry-run|write`）
- `GET /api/analytics/health/ready`：readiness 探针（返回 200/503，适配网关与 k8s）
- `GET /api/analytics/anti-abuse/alerts?page=1&pageSize=50&from=<iso>&to=<iso>&blocked=true|false&severity=warn|critical`：反滥用告警记录（需 health key）
- `POST /api/lead`：线索写入（含去重）
- `GET /api/lead/export?format=json|csv&from=<iso>&to=<iso>&type=waitlist|demo`：线索导出
- `GET /api/lead/list?page=1&pageSize=20&order=desc&q=<keyword>`：线索列表分页查询
- `POST /api/lead/export-jobs`：创建线索导出任务
- `GET /api/lead/export-jobs?page=1&pageSize=20&status=queued|running|completed|failed&from=<iso>&to=<iso>`：查询导出任务列表（支持时间窗口与分页）
- `GET /api/lead/export-jobs/:id`：查询线索导出任务状态与结果
- 可视化看板：`/[locale]/analytics`

Analytics PostgreSQL 运维脚本：

```bash
npm run analytics:migrate:website
npm run analytics:cleanup:website
```

运维说明：

- `docs/Website-Analytics-Ops-Runbook.md`

PostgreSQL 集成测试（需设置 `DATABASE_URL` 并先执行 migration）：

```bash
npm run db:migrate
npm run test:pg
```

也可一键验证：

```bash
npm run verify:pg:local
```

首次本地 PostgreSQL 启动与全流程初始化（启动 + migrate + reset + seed + verify）：

```bash
npm run bootstrap:pg:local
```

## 关键 API

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id`
- `POST /api/v1/conversations/:id/messages`
- `POST /api/v1/conversations/:id/agents`
- `POST /api/v1/agents`
- `GET /api/v1/agents`
- `GET /api/v1/agents/:id`
- `GET /api/v1/invocations`
- `GET /api/v1/invocations/:id`
- `POST /api/v1/invocations/:id/confirm`
- `GET /api/v1/audit-events`
- `GET /api/v1/receipts/:id`
- `POST /api/v1/nodes/register`
- `POST /api/v1/nodes/heartbeat`
- `POST /api/v1/nodes/sync-directory`
- `GET /api/v1/nodes`
- `GET /api/v1/metrics`

`GET /api/v1/audit-events` 支持查询参数：

- `event_type`
- `conversation_id`
- `limit`
- `cursor`

`GET /api/v1/invocations` 支持查询参数：

- `status`（`pending_confirmation` / `completed`）
- `conversation_id`

## 调用与风控说明

`POST /api/v1/conversations/:id/messages` 支持：

- 默认单 Agent 调用（不传 `target_agent_ids`）
- 多 Agent 定向调用（传 `target_agent_ids: string[]`）

多 Agent 返回会聚合：

- `meta.completed_receipts`
- `meta.pending_invocations`
- `meta.denied_agents`
- `meta.failed_agents`

## Demo 路径

1. 创建会话
2. 注册 Agent 并加入会话
3. 发送 low 风险消息（自动执行）
4. 发送 high 风险消息（进入 `pending_confirmation`）
5. 查询 Review Queue（`GET /api/v1/invocations?status=pending_confirmation`）
6. 调用确认接口完成执行
7. 再次查询 Review Queue（应出队）
8. 查看 audit-events / receipts / metrics
9. 节点注册并同步目录
10. 触发节点 Agent + 本地 Agent 的多 Agent 协作调用

也可以用脚本一键跑通：

```bash
npm run demo:phase0
```

## Open Source

- 本仓库遵循 Open Core：开源最小可接入与可验证能力，托管运营与商业化能力保持闭源分层。
- [OSS vs Cloud 能力矩阵（草案）](./docs/Agent-IM-OSS-vs-Cloud-Capability-Matrix.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
