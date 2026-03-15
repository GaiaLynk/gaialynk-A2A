# Agent IM Phase 0 验收报告

日期：2026-03-14

## 一、结论

Phase 0 主目标（可信调用的软件闭环）已完成可运行、可测试、可演示版本：

- 会话 + 目录 + 调用链路可跑通
- Trust Policy v0 可执行（allow / need_confirmation / deny）
- 审计事件可查询
- 收据可验签（HMAC-SHA256）
- 节点最小接口（register/heartbeat/list）可用

## 二、验收项对照

### 1) 用户可创建会话并加入 Agent

- `POST /api/v1/conversations`
- `POST /api/v1/agents`
- `POST /api/v1/conversations/:id/agents`
- 对应测试：`phase0-api-completeness.test.ts`

状态：✅

### 2) Agent 可完成一次真实调用并回写结果

- `POST /api/v1/conversations/:id/messages`
- 低风险路径自动执行并追加 agent 消息
- 对应测试：`sprint1-closed-loop.test.ts`

状态：✅

### 3) 高风险调用具备确认/拦截机制

- high: `need_confirmation` + `POST /api/v1/invocations/:id/confirm`
- critical: `deny`
- 对应测试：`sprint2-trust-closed-loop.test.ts`、`phase0-api-completeness.test.ts`

状态：✅

### 4) 关键事件有审计与收据

- 审计：`GET /api/v1/audit-events`（支持过滤与分页）
- 收据：`GET /api/v1/receipts/:id`（返回 `meta.is_valid`）
- 对应测试：`audit-events-query.test.ts`、`receipt.store.test.ts`

状态：✅

### 5) Node-Hub 最小闭环（可选）

- `POST /api/v1/nodes/register`
- `POST /api/v1/nodes/heartbeat`
- `GET /api/v1/nodes`
- 对应测试：`phase0-api-completeness.test.ts`

状态：✅（MVP）

## 三、测试与质量

- `npm run typecheck`：通过
- `npm test`：通过（17 tests）
- 关键测试覆盖：
  - 端到端主闭环
  - trust 决策单元
  - receipt 签发/验签单元
  - 审计查询过滤与分页
  - API 完整性与响应格式一致性

## 四、可演示与部署

- 本地运行：`npm run dev:server`
- 极简控制台：`npm run dev:console` -> `http://localhost:5173`
- 一键 demo：`npm run demo:phase0`
- 容器化：`docker compose up --build`

## 五、技术债（Phase 1 建议）

- `TRUST-DEBT`：收据签名从 HMAC 升级到 JWS/Ed25519
- `AUDIT-DEBT`：审计目前为内存存储，迁移到 append-only 持久层
- `SCALE-DEBT`：A2A Gateway 目前为 mock 响应，接入真实外部 agent 与超时重试
- `SCALE-DEBT`：引入 PostgreSQL/Redis 实际读写与迁移脚本（当前 compose 已预留服务）
- `AUDIT-DEBT`：审计查询增加更细粒度过滤（actor/risk/time range）

## 六、下一阶段建议

1. 接入真实 DB/Redis（保留现有测试并新增集成测试）
2. 接入真实 A2A 协议请求（JSON-RPC/SSE）
3. 增加 WebSocket 会话实时流
4. 收据签名标准化升级并完善验签链路
