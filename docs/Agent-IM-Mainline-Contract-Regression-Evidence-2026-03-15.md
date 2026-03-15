# Agent IM 主线冻结接口回归演练留证（2026-03-15）

日期：2026-03-15  
范围：5 个冻结接口全链路回归  
执行人：主线后端工程（Agent）

---

## 1. 执行命令

```bash
npm run test:contracts:mainline
npm run contracts:drift:mainline
npm test
npm run typecheck
```

---

## 2. 结果摘要

- `test:contracts:mainline`：通过（冻结接口守卫）
- `contracts:drift:mainline`：通过（无契约漂移）
- `npm test`：通过
- `npm run typecheck`：通过

---

## 3. 接口覆盖确认

- `POST /api/v1/public/entry-events`：成功/非法 payload/非法 JSON
- `GET /api/v1/public/entry-metrics`：核心字段与口径字段
- `GET /api/v1/agents/recommendations`：成功/非法查询参数
- `GET /api/v1/nodes/health`：成功/非法查询参数
- `POST /api/v1/nodes/relay/invoke`：成功与关键错误矩阵

---

## 4. 结论

本次冻结接口回归演练结果满足发布前门禁要求，可作为发布运营化阶段的基线证据。

