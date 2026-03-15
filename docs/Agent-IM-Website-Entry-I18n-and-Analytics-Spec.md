# Agent IM 官网三语与埋点规格（EN / 繁中 / 简中）

日期：2026-03-15  
面向对象：官网工程师、增长、内容

---

## 1. 三语策略

## 1.1 语言优先级

1. English（默认国际入口）
2. 繁體中文（港澳台与海外华语）
3. 简体中文（大陆华语表达）

## 1.2 路由与默认语言

- 默认重定向到 `/en`
- 手动切换语言并保留当前页面路径
- cookie 保存用户语言偏好

## 1.3 翻译策略

- 先写 EN 源文案，再生成 `zh-Hant`、`zh-Hans`
- 术语表集中维护，禁止每页自由翻译核心术语
- 每次版本发布需三语同步，不允许长期缺语言版本

---

## 2. 内容文件组织建议

- `content/en/*.mdx`
- `content/zh-Hant/*.mdx`
- `content/zh-Hans/*.mdx`
- `content/glossary.{en,zh-Hant,zh-Hans}.json`

每篇内容应包含：

- `title`
- `description`
- `primary_cta`
- `seo_title`
- `seo_description`

---

## 3. 核心事件埋点（MVP）

## 3.1 事件命名规则

- 小写蛇形：`page_view`, `cta_click`, `waitlist_submit`
- 必带字段：`locale`, `page`, `referrer`, `timestamp`

## 3.2 必埋事件

- `page_view`
- `cta_click`
- `docs_click`
- `demo_click`
- `waitlist_submit`
- `demo_submit`
- `lang_switch`

## 3.3 建议字段

- `locale`：`en` / `zh-Hant` / `zh-Hans`
- `page`：页面标识
- `cta_id`：按钮唯一标识
- `source`：来源渠道（utm/source）
- `device_type`：mobile/desktop

---

## 4. 漏斗定义（首版）

## 4.1 开发者漏斗

`page_view(home)` -> `cta_click(start_building)` -> `docs_click` -> `activation_event`

## 4.2 商务漏斗

`page_view(home)` -> `cta_click(book_demo)` -> `demo_submit` -> `qualified_demo`

## 4.3 泛兴趣漏斗

`page_view(home)` -> `cta_click(join_waitlist)` -> `waitlist_submit`

---

## 5. 监控指标（周维度）

- 首页到主 CTA 点击率
- Waitlist 提交转化率
- Demo 提交转化率
- 不同语言版本转化对比
- 移动端 vs 桌面端转化差异
- 高跳出页面 Top 5

---

## 6. 数据治理与隐私

- 表单只收集最小必要字段
- 敏感数据脱敏或加密存储
- 合规披露（隐私政策、cookie 提示）可访问
- 禁止在埋点中发送敏感正文内容

---

## 7. 发布与复盘节奏

每周固定输出：

1. 数据快照（漏斗 + 关键页面）
2. 问题诊断（掉点环节）
3. 下周实验计划（文案、CTA、信息层级）

每月输出：

- 三语内容质量评估
- 高价值页面迭代优先级
- 与主线产品指标的联动分析

---

## 8. 一句话原则

**三语不是“翻译工作”，而是“同一战略在不同语言下的高一致性表达与转化系统”。**
