# CLAUDE 指南

## 项目说明

本项目是一个网页版热量计算器，目标是让用户记录每日摄入的食物，自动计算热量与营养素，并根据科学标准提供饮食与运动建议。纯前端项目，无需后端。

## 关键文件路径

- 主页面：[index.html](index.html)
- 样式文件：[css/style.css](css/style.css)
- 应用入口：[js/app.js](js/app.js)
- 用户认证：[js/auth.js](js/auth.js)
- API 集成：[js/api.js](js/api.js)
- 食物数据库：[js/food-database.js](js/food-database.js)
- 搜索逻辑：已内置于 [js/app.js](js/app.js) 和 [js/food-database.js](js/food-database.js)
- 数据存储：已内置于 [js/app.js](js/app.js)（通过 localStorage 直接读写）
- 摄入追踪：已内置于 [js/app.js](js/app.js)
- 仪表盘：[js/dashboard.js](js/dashboard.js)
- 建议引擎：[js/advisor.js](js/advisor.js)
- 历史记录：[js/history.js](js/history.js)
- 用户设置：[js/settings.js](js/settings.js)
- 自定义食物：[js/custom-food.js](js/custom-food.js)
- 需求文档：[docs/01-project-requirements.md](docs/01-project-requirements.md)
- 技术说明：[docs/02-technical-notes.md](docs/02-technical-notes.md)
- 设计规范：[docs/03-design-guidelines.md](docs/03-design-guidelines.md)
- 开发计划：[docs/04-development-plan.md](docs/04-development-plan.md)
- 开发日志目录：[development-logs/](development-logs/)

## 工作说明

- 本项目采用纯 HTML + CSS + JS 实现，无框架、无构建工具、无 npm 依赖。
- 数据存储使用 localStorage，键名以 `cc_` 为前缀。登录用户的键名格式为 `cc_{userId}_*`，匿名用户为 `cc_*`。
- 数据隔离通过 `auth.js` 中的 `storageKey(baseKey)` 函数实现，所有 localStorage 读写都通过此函数。
- 任何界面修改都应优先参考 [docs/03-design-guidelines.md](docs/03-design-guidelines.md) 中的设计规范。
- 任何功能实现都应参考 [docs/01-project-requirements.md](docs/01-project-requirements.md) 确认需求边界。
- 任何数据结构变更都应更新 [docs/02-technical-notes.md](docs/02-technical-notes.md) 中的对应部分。
- 每次开发完成后，应在 [development-logs/](development-logs/) 下新增或更新当日日志（格式：`YYYY-MM-DD.md`），记录完成事项和待办事项。
- 开发进度更新应同步修改 [docs/04-development-plan.md](docs/04-development-plan.md) 中的 Phase 状态表。
- 每个 Phase 完成后，先验证功能正常，再做下一步，不要一口气做多个 Phase。
- 任何修改都要确保不破坏已有功能（搜索、添加、删除、仪表盘、建议、历史、设置、登录、AI）。

## 技术约束

- 零依赖：不引入任何第三方库或框架
- 纯静态：所有功能在浏览器端完成
- 离线可用：不依赖网络（食物数据内置）
- 移动端优先：以手机屏幕为首要适配目标

## 用户背景

本项目面向不懂代码的小白用户。代码注释应清晰，变量命名应语义化。
