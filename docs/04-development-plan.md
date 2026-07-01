# 开发计划

## 开发原则

- **小步推进**：每阶段只完成一个可验证的功能模块
- **稳定优先**：每阶段完成后确认功能正常再进入下一阶段
- **不破坏已有功能**：新增功能前确保已有功能不受影响
- **每日记录**：每次开发结束后更新 `development-logs/` 下的当日日志

---

## Phase 1：项目骨架搭建

**目标**：创建空白页面，搭建 HTML 结构、CSS 基础样式，建立项目文件结构。

**产出**：
- `index.html` — 页面骨架（所有区域占位）
- `css/style.css` — CSS 变量、基础重置样式、区域布局
- `js/app.js` — 空入口，初始化日志

**验证标准**：在浏览器打开 `index.html`，能看到完整的页面布局分区（各区域显示占位文字）。

---

## Phase 2：食物数据库

**目标**：构建内置食物数据库，覆盖中餐常见食物。

**产出**：
- `js/food-database.js` — 约 100-200 种食物数据
  - 主食类（米饭、面条、馒头等）
  - 肉类（猪肉、鸡肉、牛肉、鱼肉等）
  - 蔬菜类（青菜、番茄、黄瓜等）
  - 水果类（苹果、香蕉等）
  - 蛋奶类
  - 豆制品
  - 零食与饮品
  - 常见中式菜品（番茄炒蛋、宫保鸡丁等）

**验证标准**：在浏览器控制台可调用搜索函数，返回匹配结果。

---

## Phase 3：食物搜索与录入

**目标**：实现搜索框，用户可搜索食物并添加到今日列表。

**产出**：
- `js/search.js` — 搜索逻辑（模糊匹配、实时筛选）
- `js/storage.js` — localStorage 读写封装
- `js/tracker.js` — 今日摄入记录管理
- 搜索 UI（输入框 + 下拉结果列表）
- 份量选择（弹窗/面板）
- 今日摄入列表渲染

**验证标准**：搜索"米饭"→ 选择份量 → 添加到列表 → 刷新页面数据仍在。

---

## Phase 4：热量仪表盘

**目标**：顶部仪表盘展示今日热量摄入概况。

**产出**：
- `js/dashboard.js` — 仪表盘计算与渲染
- 环形/条形进度条（纯 CSS 或 SVG）
- 三大营养素展示卡片
- 实时更新（添加/删除食物后自动刷新）

**验证标准**：添加食物后仪表盘实时更新，热量和营养素数据正确。

---

## Phase 5：科学建议引擎

**目标**：根据摄入数据自动生成饮食与运动建议。

**产出**：
- `js/advisor.js` — 建议规则引擎
- 运动消耗参考数据
- 建议卡片 UI（不同场景不同样式）
  - 热量超标 → 运动建议
  - 热量不足 → 食物推荐
  - 营养素失衡 → 调整建议

**验证标准**：不同摄入场景下建议内容合理变化。

---

## Phase 6：历史记录

**目标**：可查看过往每日饮食记录与简单统计。

**产出**：
- `js/history.js` — 历史数据查询
- 历史页面/面板（日期切换）
- 7 天统计摘要
- 底部导航切换（仪表盘 ↔ 历史）

**验证标准**：可切换日期查看历史记录，统计数据正确。

---

## Phase 7：用户设置

**目标**：允许用户调整体重目标和热量目标。

**产出**：
- `js/settings.js` — 设置管理
- 设置面板（目标选择、自定义热量值、个人信息）
- 设置变更后自动重算推荐值

**验证标准**：切换到"减重"模式后，推荐热量自动降低约 300-500 kcal。

---

## Phase 8：自定义食物

**目标**：允许用户添加数据库中没有的食物。

**产出**：
- 自定义食物表单
- 自定义食物存储与搜索融合
- 编辑和删除自定义食物

**验证标准**：添加自定义食物后可在搜索结果中找到并使用。

---

## Phase 9：体验打磨

**目标**：细节优化、动画过渡、PWA 支持。

**产出**：
- 添加/删除动画
- 空状态引导
- PWA manifest + Service Worker
- 移动端手势优化
- 首次使用引导

**验证标准**：整体体验流畅，可添加到手机主屏幕。

---

## Phase 10：多用户登录系统

**目标**：实现用户名+密码注册/登录，数据按用户隔离。

**产出**：
- `js/auth.js` — 认证模块（注册/登录/登出/会话管理/数据隔离）
- 登录/注册 UI（`#auth-screen`）
- 所有 JS 文件的数据键隔离改造（`storageKey()` 函数）
- 设置弹窗中的账号信息和登出按钮

**验证标准**：注册→登录→数据隔离→登出→数据不丢失。

---

## Phase 11：DeepSeek API 集成

**目标**：接入 DeepSeek API，实现 AI 食物估计和 AI 智能建议。

**产出**：
- `js/api.js` — DeepSeek API 调用模块
- AI 食物估计弹窗（自然语言描述 → AI 估计营养 → 确认添加）
- AI 深度分析功能（发送当日摄入 → 获取个性化建议）
- 设置弹窗中的 API Key 配置区域

**验证标准**：配置 API Key → AI 估计食物 → AI 获取建议 → 未配置或网络异常时规则引擎正常工作。

---

## Phase 12：AI 建议持久化 + 代理模式优化 → Kimi 迁移

**目标**：AI 建议退出后不丢失，代理模式内置默认密钥，迁移至 Kimi API。

**产出**：
- `js/api.js`：新增 `saveAIAdvice()` / `loadAIAdvice()` 持久化函数（仅 localStorage）
- `js/advisor.js`：`renderAdvice()` 自动恢复已保存建议；`requestAIAdvice()` 成功后自动保存
- 从 DeepSeek 迁移至 Kimi（月之暗面 Moonshot）API
- 代理配置文件填入默认密钥（Nginx / Cloudflare Worker / Vercel）
- 设置 UI 显示「默认密钥」状态（代理模式 + 无用户 Key 时）
- Cloudflare Pages Functions API 代理
- 安全措施：`functions/proxy/[[path]].js` 拦截 `/proxy/*` 访问

**验证标准**：AI 分析后切换到其他 Tab 再回来，建议仍在；代理模式下无需填 Key 即可使用全部 AI 功能。

---

## Phase 13：AI 每日食谱计划 + 底部导航重构

**目标**：新增 AI 每日食谱独立 Tab，底部导航升级为 3Tab，每个子界面增加返回按钮。

**产出**：
- `js/api.js`：新增 `getDailyMealPlan()` / `saveMealPlan()` / `loadMealPlan()`
- `js/advisor.js`：新增 `renderMealPlan()` / `generateMealPlan()` / `renderMealPlanResultHTML()`
- `index.html`：新增 AI 食谱面板 + 底部导航第三个 Tab + 顶部返回按钮
- `js/app.js`：`switchTab()` 新增 `mealplan` 分支；新增 `showMealPlanView()`；返回按钮显隐逻辑
- `css/style.css`：新增食谱卡片样式 + 返回按钮样式
- 设置弹窗手机端适配：`modal-body` 滚动容器 + `modal-header` + `✕` 关闭按钮

**验证标准**：底部 3 个 Tab 独立切换；食谱面板只在 AI食谱 Tab 显示；返回按钮在子界面可见、仪表盘隐藏；手机端设置弹窗可完整滚动查看。

---

## Phase 14：Cloudflare D1 数据库集成

**目标**：将用户数据从纯 localStorage 迁移到 Cloudflare D1 数据库，实现跨设备数据同步。

**产出**：
- `functions/_shared/auth.js` — 公共鉴权模块（Bearer Token 验证 + CORS + 响应工具）
- `functions/api/auth.js` — 认证 API（注册/登录/登出/验证会话）
- `functions/api/data/[[route]].js` — 数据 CRUD API（记录/食物/设置/AI缓存/全量同步）
- `js/db.js` — 客户端数据访问层
  - API 封装（`apiRequest` / `apiGet` / `apiPost` / `apiPut` / `apiDelete`）
  - Session Token 管理（双写 sessionStorage + localStorage）
  - 离线缓存（localStorage 作为 D1 的本地镜像）
  - 离线队列（`cc_pending_sync`，恢复网络后自动重放）
  - 字段名规范化（`normalizeRecord()` — D1 snake_case → 客户端 camelCase）
  - 全量同步（`syncFromServer()` / `migrateToServer()`）
- D1 数据库 6 张表：`users`, `sessions`, `food_records`, `custom_foods`, `user_settings`, `ai_cache`
- `wrangler.toml` — D1 数据库绑定配置

**验证标准**：注册/登录对接 D1；跨设备登录数据同步；离线时自动降级到 localStorage。

---

## Phase 15：跨设备登录修复 + 字段映射 + UI 修复

**目标**：修复跨设备登录失败、D1 数据字段显示 undefined、搜索栏文字重叠等问题。

**产出**：
- `js/auth.js`：`loginUser()` 改为发送明文密码（服务端用存储盐验证），支持跨设备登录
- `functions/api/auth.js`：`handleLogin()` 新增 `serverHash()` 函数，服务端哈希验证
- `js/db.js`：`loginRemote()` 发送 `password` 而非 `passwordHash`
- `js/db.js`：`normalizeRecord()` 统一 snake_case → camelCase 转换
- `css/style.css`：`.search-add-custom` 添加 `flex-wrap: wrap` 修复窄屏文字重叠

**验证标准**：新设备可用用户名+密码登录；食物记录正常显示名称和份量；搜索栏底部文字不重叠。

---

## Phase 16：功能改进 — 强制登录 + AI 本地化 + 日期可见性

**目标**：移除匿名登录、AI 数据仅存本地、AI 功能按日期显示/隐藏。

**产出**：
- `index.html`：删除 auth-skip 按钮，替换为静态提示文字
- `js/app.js`：
  - 删除 `onAuthSkip()` 函数和 `auth-skip` 事件绑定
  - `showDashboardView()` / `switchTab()` / `refreshView()`：AI 建议仅当日显示、AI食谱Tab仅当天及未来显示
- `js/api.js`：
  - `saveAIAdvice()` / `loadAIAdvice()` / `saveMealPlan()` / `loadMealPlan()` 改为同步函数（仅操作 localStorage）
  - `getDailyMealPlan()` 新增 `todayIntakeContext` 参数，支持下一餐建议
- `js/advisor.js`：
  - 移除 `loadAIAdvice()` / `saveAIAdvice()` / `loadMealPlan()` / `saveMealPlan()` 的 `await`
  - `renderAdvice()`：AI 分析按钮仅当日显示
  - `generateMealPlan()`：当日摄入记录传给 AI 生成下一餐建议
  - `renderMealPlanResultHTML()`：新增下一餐建议卡片
- `js/db.js`：`syncFromServer()` 和 `migrateToServer()` 移除 AI 缓存同步

**验证标准**：登录界面无「跳过」按钮；AI 建议切换日期后隐藏；AI食谱Tab在历史日期隐藏；AI生成食谱包含基于当日摄入的下一餐建议。

---

## Bug Fix：advisor.js 重复 const 声明导致所有按钮失效

**问题**：`js/advisor.js` — `generateMealPlan()` 函数内 `const dateStr` 在第 578 行和第 638 行重复声明，导致 `SyntaxError: Identifier 'dateStr' has already been declared`。advisor.js 解析失败 → `renderAdvice` 未定义 → `initApp()` 崩溃 → `bindEvents()` 未执行 → 所有按钮无反应。

**修复**：删除第 638 行重复的 `const dateStr` 声明，复用第 578 行的变量（值相同）。

**修复日期**：2026-07-01

---

## 当前进度

| Phase | 状态 | 完成日期 |
|-------|------|----------|
| Phase 1 | ✅ 已完成 | 2026-06-29 |
| Phase 2 | ✅ 已完成 | 2026-06-29 |
| Phase 3 | ✅ 已完成 | 2026-06-29 |
| Phase 4 | ✅ 已完成 | 2026-06-29 |
| Phase 5 | ✅ 已完成 | 2026-06-29 |
| Phase 6 | ✅ 已完成 | 2026-06-29 |
| Phase 7 | ✅ 已完成 | 2026-06-29 |
| Phase 8 | ✅ 已完成 | 2026-06-29 |
| Phase 9 | ✅ 已完成 | 2026-06-29 |
| Phase 10 | ✅ 已完成 | 2026-06-29 |
| Phase 11 | ✅ 已完成 | 2026-06-29 |
| Phase 12 | ✅ 已完成 | 2026-06-30 |
| Phase 13 | ✅ 已完成 | 2026-06-30 |
| Phase 14 | ✅ 已完成 | 2026-06-30 |
| Phase 15 | ✅ 已完成 | 2026-07-01 |
| Phase 16 | ✅ 已完成 | 2026-07-01 |
| Bug Fix | ✅ 已修复 | 2026-07-01 |
