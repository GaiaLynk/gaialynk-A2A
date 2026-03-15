# Agent IM 主线契约-测试映射表（v1）

日期：2026-03-15  
范围：冻结接口契约与兼容守卫

---

## 1. 映射原则

- 每个冻结接口必须有至少一条“成功契约”与一条“错误契约”测试。
- 任一契约字段/错误码变更时，必须同步更新本映射表与对应测试。

---

## 2. 一对一映射

| 冻结接口 | 契约文档章节 | 主要守卫测试 | 补充回归测试 |
|---|---|---|---|
| `POST /api/v1/public/entry-events` | `Agent-IM-Mainline-API-Contract-Matrix-v1.md` `2.1` | `packages/server/tests/mainline-contract-compatibility.test.ts` | `packages/server/tests/phase1-mainline-apis.test.ts` |
| `GET /api/v1/public/entry-metrics` | `...` `2.2` | `packages/server/tests/mainline-contract-compatibility.test.ts` | `packages/server/tests/phase1-mainline-apis.test.ts` |
| `GET /api/v1/agents/recommendations` | `...` `2.3` | `packages/server/tests/mainline-contract-compatibility.test.ts` | `packages/server/tests/phase1-mainline-apis.test.ts` |
| `GET /api/v1/nodes/health` | `...` `2.4` | `packages/server/tests/mainline-contract-compatibility.test.ts` | `packages/server/tests/phase1-mainline-apis.test.ts` |
| `POST /api/v1/nodes/relay/invoke` | `...` `2.5` | `packages/server/tests/mainline-contract-compatibility.test.ts` | `packages/server/tests/phase1-mainline-apis.test.ts` |

---

## 3. CI 映射

- `mainline-contract-compatibility`：冻结契约守卫门禁。
- `mainline-contract-drift`：基线漂移检测与差异报告。
- `test-and-typecheck`、`postgres-integration`：主线功能与集成门禁。

