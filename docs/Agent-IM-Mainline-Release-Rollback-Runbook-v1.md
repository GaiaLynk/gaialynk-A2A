# Agent IM 主线发布与回滚演练手册（v1）

日期：2026-03-15  
对象：主线后端、值班工程、产品/运营联调负责人

---

## 1. 发布前检查（Preflight）

执行命令：

```bash
npm run release:preflight:mainline
```

通过标准：

- `typecheck` 通过
- 契约守卫通过
- 契约漂移检测通过
- 全量测试通过
- （可选）`DATABASE_URL` 存在时 PG 集成通过

---

## 2. 发布后冒烟（Post-release Smoke）

执行命令：

```bash
MAINLINE_BASE_URL=https://<target-host> npm run release:smoke:mainline
```

通过标准：

- 冻结 5 接口关键路径可用
- 关键错误码路径行为符合契约
- 冒烟脚本返回 `ok: true`

---

## 3. 失败即回滚标准动作

触发条件（任一满足）：

1. preflight 未通过；
2. post-release smoke 未通过；
3. 线上出现契约破坏（字段缺失/错误码变化）影响官网联调；
4. 高风险调用链路出现不可回退异常。

标准动作：

1. 立即停止继续发布动作；
2. 在 10 分钟内执行回滚到上一个稳定 commit/tag；
3. 重新跑 post-release smoke；
4. 提交事件复盘单（原因、影响、修复、预防）。

---

## 4. 责任人矩阵（RACI）

| 动作 | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| preflight 执行 | 主线值班工程师 | 主线技术负责人 | QA | 产品/运营 |
| 发布执行 | 平台工程师 | 主线技术负责人 | 网站联调工程师 | CTO |
| 回滚执行 | 主线值班工程师 | 主线技术负责人 | 平台工程师 | CTO/产品 |
| 事故复盘 | 主线技术负责人 | CTO | QA/平台/网站线 | 全体相关方 |

