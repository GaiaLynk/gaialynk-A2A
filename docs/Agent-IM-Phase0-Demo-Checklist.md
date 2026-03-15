# Agent IM Phase 0 Demo Checklist

## 目标

用同一条流程证明：

1. 能协作（会话 + Agent + 调用）
2. 能可信地协作（Trust + 审计 + 收据）
3. 具备最小网络证明能力（Node register + heartbeat）

## 预置

- 启动后端：`npm run dev:server`
- 启动控制台：`npm run dev:console`
- 打开：`http://localhost:5173`

## 演示步骤

1. **初始化数据**
   - 在控制台填写会话名、Agent 名、风险等级（先 low）
   - 点击「初始化 Demo 数据」
   - 期望：返回 `conversation_id` 与 `agent_id`

2. **低风险调用自动执行**
   - 发送消息
   - 期望：返回 201，`meta.trust_decision.decision = allow`
   - 期望：会产生 receipt id

3. **高风险调用确认执行**
   - 再创建一组 high 风险 Agent
   - 发送消息
   - 期望：返回 202，`decision = need_confirmation` 且带 `invocation_id`
   - 点击「确认执行」
   - 期望：返回 200，状态 completed

4. **审计可见**
   - 点击「刷新审计与指标」
   - 期望：可看到 `invocation.allowed` / `invocation.need_confirmation` / `invocation.completed`

5. **收据可验签**
   - 使用 receipt id 调用 `GET /api/v1/receipts/:id`
   - 期望：`meta.is_valid = true`

6. **节点最小闭环**
   - 调用 `POST /api/v1/nodes/register`
   - 调用 `POST /api/v1/nodes/heartbeat`
   - 期望：节点状态在线

## 通过标准

- 低风险路径可稳定通过
- 高风险路径必须确认才执行
- 审计事件完整可见
- 收据验签成功
- 节点注册与心跳可用
