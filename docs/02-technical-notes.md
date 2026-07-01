# 技术说明

## 技术选型

| 项 | 选择 | 原因 |
|----|------|------|
| 前端框架 | 无框架，纯 HTML + CSS + JS | 无需构建工具，小白可维护 |
| CSS 方案 | 原生 CSS（CSS 变量 + Flexbox + Grid） | 零依赖，移动端友好 |
| 数据存储 | Cloudflare D1（主） + localStorage（缓存） | 跨设备同步 + 离线可用 |
| 后端服务 | Cloudflare Pages Functions | 边缘计算，低延迟 |
| 图标 | Emoji / SVG 内嵌 | 不依赖图标库 |

## 项目结构

```
热量计算器/
├── index.html              # 主页面（唯一页面，SPA 模式）
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 应用入口，初始化与协调（3Tab导航 + 视图切换）
│   ├── food-database.js    # 内置食物数据库（293 种食物，8 个分类）
│   ├── auth.js             # 用户认证（注册/登录/登出/会话管理/数据隔离）
│   ├── db.js               # D1 数据访问层（API封装 + 离线缓存 + 同步队列）
│   ├── api.js              # Kimi API 集成（食物估计 + AI建议 + 每日食谱）
│   ├── settings.js         # 用户设置（BMR + 热量目标 + API Key + 代理模式）
│   ├── custom-food.js      # 自定义食物 CRUD
│   ├── dashboard.js        # 仪表盘渲染（环形进度条 + 营养素卡片 + 供能比例条）
│   ├── advisor.js          # 科学建议引擎（规则引擎 + AI深度分析 + AI食谱计划）
│   ├── history.js          # 历史记录管理（7 天统计 + 日期列表）
├── functions/              # Cloudflare Pages Functions（服务端API）
│   ├── _shared/
│   │   └── auth.js         # 公共鉴权函数（Bearer Token 验证 + CORS + 响应工具）
│   ├── api/
│   │   ├── auth.js         # 认证 API（注册/登录/登出/验证）
│   │   ├── data/
│   │   │   └── [[route]].js # 数据 CRUD API（记录/食物/设置/AI缓存/同步）
│   │   ├── kimi/
│   │   │   └── chat/completions.js  # Kimi API 代理（内置默认密钥）
│   │   └── deepseek/
│   │       └── chat/completions.js  # DeepSeek API 代理（向后兼容）
│   └── proxy/
│       └── [[path]].js      # 拦截 /proxy/* 路径（安全防护）
├── proxy/                  # 代理配置参考文件（非 Cloudflare 部署用）
│   ├── nginx.conf
│   ├── cloudflare-worker.js
│   ├── vercel.json
│   └── README.md
├── docs/                   # 项目文档
├── development-logs/       # 开发日志
└── CLAUDE.md               # 开发指引
```

## 架构：D1 + localStorage 双轨制

```
浏览器 (Client)                         Cloudflare Edge
+------------------+                    +---------------------------+
| localStorage     |  <-- 离线缓存       | D1 数据库 (SQLite)       |
+------------------+                    | - users (用户表)         |
        ^                               | - sessions (会话表)      |
        | 写入时同步更新                  | - food_records (饮食记录) |
+------------------+   fetch()   +------+ - custom_foods (自定义)   |
| JS App           | ----------> | Functions /api/*                |
| (db.js 数据层)    | <---------- | - /api/auth (登录/注册)        |
+------------------+  JSON       | - /api/data (CRUD + 同步)     |
                                 +--------------------------------+
```

**策略：D1 为主，localStorage 为缓存。** 每条数据操作都先请求 D1，成功则更新本地缓存；网络失败则使用本地缓存，标记待同步。

## 数据库表设计（D1）

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户注册信息 | id, username, password_hash, salt |
| `sessions` | 登录会话（Bearer Token） | token, user_id, expires_at |
| `food_records` | 每日饮食记录 | id, user_id, record_date, food_name, calories, protein, fat, carbs |
| `custom_foods` | 用户自定义食物 | id, user_id, name, cal, protein, fat, carbs |
| `user_settings` | 用户设置 | user_id, settings_json |
| `ai_cache` | AI 建议/食谱缓存 | user_id, cache_type, cache_date, data_json |

## 数据模型

### 食物条目（food-database.js）

```js
{
  id: 's01',
  name: '米饭（熟）',
  category: 'staple',           // staple|meat|vegetable|fruit|egg_dairy|soy|snack|dish
  cal: 116,                     // kcal/100g
  carbs: 25.9,                  // g/100g
  protein: 2.6,                 // g/100g
  fat: 0.3,                     // g/100g
  servings: [
    { label: '1小碗', g: 150 },
    { label: '1大碗', g: 300 },
    { label: '100g', g: 100 }
  ]
}
```

### 摄入记录

D1 存储使用 snake_case 字段，客户端通过 `normalizeRecord()` 统一转为 camelCase：

```js
// D1 存储格式（snake_case）：
{
  id: 'uniq_id',
  food_id: 's01',
  food_name: '米饭（熟）',
  category: 'staple',
  grams: 150,
  serving_label: '1小碗',
  calories: 174,
  carbs: 38.85,
  protein: 3.9,
  fat: 0.45,
  time: '08:30',
  record_date: '2026-07-01',
  user_id: 'u_xxx'
}

// 客户端使用格式（camelCase，由 normalizeRecord() 转换）：
{
  id: 'uniq_id',
  foodId: 's01',
  foodName: '米饭（熟）',
  category: 'staple',
  grams: 150,
  servingLabel: '1小碗',
  calories: 174,
  carbs: 38.85,
  protein: 3.9,
  fat: 0.45,
  time: '08:30'
}
```

### 营养目标（dashboard.js）

根据《中国居民膳食指南》供能比自动推算：

```js
// 以 2200 kcal 目标为例
targets = {
  carbs:   302,   // 2200 × 0.55 ÷ 4
  protein: 83,    // 2200 × 0.15 ÷ 4
  fat:     73     // 2200 × 0.30 ÷ 9
}
```

### 用户设置

```js
{
  goal: 'maintain',              // 'lose' | 'maintain' | 'gain'
  gender: 'male',                // 'male' | 'female'
  age: 25,
  weight: 70,                    // kg
  height: 170,                   // cm
  customCalorieTarget: null      // null = 自动计算，number = 手动指定
}
```

### 热量目标计算（settings.js）

**Mifflin-St Jeor 公式（BMR）：**
- 男：10 × 体重 + 6.25 × 身高 - 5 × 年龄 + 5
- 女：10 × 体重 + 6.25 × 身高 - 5 × 年龄 - 161

**TDEE = BMR × 1.2（久坐/轻体力活动系数）**

**目标调整：**
- 减重：TDEE - 400 kcal（下限 1200 kcal）
- 保持：TDEE（不变）
- 增重：TDEE + 400 kcal

**全局接口：** `getCalorieTarget()` — dashboard.js / advisor.js / history.js 均通过此函数获取当前热量目标，无需传递参数。

## 存储方案

### D1 存储（云端）

| 表名 | 同步方向 | 说明 |
|------|----------|------|
| `users` | 读写 | 用户注册信息，密码哈希+盐 |
| `sessions` | 读写 | Bearer Token，30天过期 |
| `food_records` | 双向同步 | 饮食记录，按 user_id + date 索引 |
| `custom_foods` | 双向同步 | 用户自定义食物 |
| `user_settings` | 双向同步 | 用户偏好设置 |
| `ai_cache` | 仅上传（已废弃） | AI 缓存表现在仅存本地，不再上传 |

### localStorage 存储（本地缓存）

- 键名规范：`cc_` 前缀（Calorie Calculator）
- 登录用户自动添加 `cc_{userId}_*` 前缀隔离数据

| 键名格式 | 内容 | 存储位置 | 说明 |
|----------|------|----------|------|
| `cc_records_YYYY-MM-DD` | JSON 数组 | D1 + 本地缓存 | 每日摄入记录 |
| `cc_settings` | JSON 对象 | D1 + 本地缓存 | 用户设置 |
| `cc_custom_foods` | JSON 数组 | D1 + 本地缓存 | 用户自定义食物 |
| `cc_session` | JSON 对象 | 仅本地 | 当前登录会话 |
| `cc_session_token` | string | 仅本地 | D1 Bearer Token |
| `cc_users` | JSON 数组 | 仅本地 | 本地注册用户备份 |
| `cc_apikey_kimi` | string | 仅本地 | Kimi API Key（不上传） |
| `cc_proxy_mode` | boolean | 仅本地 | 代理模式开关 |
| `cc_proxy_path` | string | 仅本地 | 代理路径 |
| `cc_ai_advice_YYYY-MM-DD` | JSON 对象 | **仅本地** | AI 建议（不上传 D1） |
| `cc_mealplan_YYYY-MM-DD` | JSON 对象 | **仅本地** | AI 食谱（不上传 D1） |
| `cc_pending_sync` | JSON 数组 | 仅本地 | 离线写入队列 |
| `cc_migrated_to_d1` | boolean | 仅本地 | 迁移标记 |
| `cc_synced_to_d1` | boolean | 仅本地 | 同步标记 |

> **重要**：AI 建议（`cc_ai_advice_*`）和 AI 食谱（`cc_mealplan_*`）仅存储在 localStorage，不会上传到 D1 云端数据库。

## API 端点设计

### 认证接口 — `POST /api/auth`

| action | 说明 | 认证 |
|--------|------|------|
| `register` | 注册新用户 | 无需 |
| `login` | 登录（明文密码，服务端哈希验证） | 无需 |
| `logout` | 登出 | Bearer Token |
| `validate` | 验证会话有效性 | Bearer Token |

### 数据接口 — `/api/data/*`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/data/records?date=` | 获取某日饮食记录 | Bearer Token |
| POST | `/api/data/records` | 添加饮食记录 | Bearer Token |
| DELETE | `/api/data/records` | 删除饮食记录 | Bearer Token |
| GET | `/api/data/records/summaries` | 历史汇总 | Bearer Token |
| GET/POST/DELETE | `/api/data/custom-foods` | 自定义食物 CRUD | Bearer Token |
| GET/PUT | `/api/data/settings` | 用户设置读写 | Bearer Token |
| GET/POST | `/api/data/ai-cache` | AI 缓存（已废弃） | Bearer Token |
| GET/POST | `/api/data/sync` | 全量同步 | Bearer Token |

## 认证流程

### 注册
1. 客户端生成 SHA-256 + 随机盐哈希（本地）
2. 发送到 `POST /api/auth`（`action: register`）
3. 服务端存储到 D1 `users` 表
4. 生成 session token 返回客户端
5. 客户端同时保存本地会话 `cc_session`

### 登录（跨设备支持）
1. 客户端发送**明文密码**（HTTPS 加密传输）到 `POST /api/auth`（`action: login`）
2. 服务端从 D1 读取用户存储的盐，做 SHA-256 哈希后与存储的哈希比对
3. 验证成功 → 返回 session token
4. 客户端调用 `syncFromServer()` 拉取最新数据
5. 兼容旧客户端：也支持预哈希密码直接比对

### 离线回退
1. 远程 API 不可用 → 降级到本地 localStorage 密码验证
2. 数据操作先更新 localStorage，异步推送 D1
3. 推送失败 → 加入 `cc_pending_sync` 队列
4. 恢复网络 → `processPendingSync()` 自动重放

## 热量标准参考

参考《中国居民膳食指南（2022）》：

- 轻体力活动成年男性：约 2250 kcal/天
- 轻体力活动成年女性：约 1800 kcal/天
- 三大营养素供能比：碳水 50-65%、蛋白质 10-15%、脂肪 20-30%

## 运动消耗参考

| 运动类型 | kcal/分钟（70kg 体重） | 数据来源 |
|----------|----------------------|----------|
| HIIT 高强度间歇 | 12 | advisor.js |
| 跳绳 | 10 | advisor.js |
| 爬楼梯 | 9 | advisor.js |
| 游泳 | 8.3 | advisor.js |
| 跑步（8km/h） | 8 | advisor.js |
| 骑行（16km/h） | 7 | advisor.js |
| 快走（6km/h） | 5 | advisor.js |
| 瑜伽 | 3.5 | advisor.js |

## 建议引擎分析维度

| 维度 | 阈值 | 说明 |
|------|------|------|
| 热量-严重超标 | >120% 目标 | danger 卡片 + 运动方案 |
| 热量-超标 | >105% 目标 | warning 卡片 + 运动方案 |
| 热量-适中 | 85-105% 目标 | good 卡片 |
| 热量-不足 | <85% 目标 | info 卡片 + 食物补充建议 |
| 碳水-偏高 | >65% 供能比 | warning 卡片 + 复合碳水替代 |
| 碳水-偏低 | <45% 供能比 | info 卡片 |
| 蛋白质-严重不足 | <8% 供能比 | danger 卡片 + 高蛋白食物标签 |
| 蛋白质-偏少 | <12% 供能比 | info 卡片 + 高蛋白食物标签 |
| 蛋白质-偏高 | >25% 供能比 | info 卡片 |
| 脂肪-偏高 | >35% 供能比 | warning 卡片 |
| 脂肪-偏低 | <15% 供能比 | info 卡片 |
| 综合均衡 | 三者均在推荐范围 | good 卡片 |

## 浏览器兼容性

- 支持 Chrome、Edge、Firefox 最新版本
- 支持移动端 Safari（iOS 14+）、Chrome Android

## 多用户登录系统

### 用户存储

**D1 `users` 表（主存储）：**

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**localStorage 备份（`cc_users`）：**

```json
[
  {
    "username": "用户名",
    "passwordHash": "SHA-256哈希值（hex）",
    "salt": "随机盐（hex 32字符）",
    "userId": "u_xxx",
    "createdAt": "ISO时间戳"
  }
]
```

### 会话管理

- **D1 `sessions` 表**：token, user_id, expires_at（30天过期）
- **本地 `cc_session`**：userId, username, loginTime
- **本地 `cc_session_token`**：Bearer Token（双写 sessionStorage + localStorage）

### 数据隔离

- 登录模式：在 `cc_` 后插入 `{userId}_`（如 `cc_u123_records_YYYY-MM-DD`）
- 通过 `storageKey(baseKey)` 函数自动切换
- 不再支持匿名模式（必须登录使用）

### 密码安全

- 注册：客户端 Web Crypto API `SHA-256` + 随机盐 → 发送哈希到服务端
- 登录：客户端发送明文密码（HTTPS）→ 服务端用存储的盐做 SHA-256 验证
- 跨设备：客户端无需知道盐值，服务端统一验证
- 定位是「防止数据混乱 + 跨设备同步」而非金融级安全

## Kimi API 集成（月之暗面 Moonshot）

### 端点与模式

- API 端点：`https://api.moonshot.cn/v1/chat/completions`
- 模型：`moonshot-v1-8k`（可自定义）
- 代理端点：`/api/kimi/chat/completions`（同源路径）

**两种工作模式：**

| 模式 | 请求路径 | Authorization | 适用场景 |
|------|----------|---------------|----------|
| 代理模式 | 同源 `/api/kimi/chat/completions` | 服务端附加默认密钥 | 零配置、安全（推荐） |
| 直接模式 | `https://api.moonshot.cn/v1/chat/completions` | 浏览器携带用户 Key | 用户使用自有 Key |

**默认密钥安全设计：**
- 密钥仅存储在服务端 `functions/api/kimi/chat/completions.js`
- 前端代码中不包含密钥的任何片段
- `functions/proxy/[[path]].js` 拦截 `/proxy/*` 路径，防止配置文件泄漏
- 代理模式下用户无需填写任何 API Key 即可使用所有 AI 功能

### AI 功能

| 功能 | 函数 | 存储位置 | 说明 |
|------|------|----------|------|
| 食物估计 | `estimateFood(description)` | 无持久化 | 自然语言描述食物，返回营养估计JSON |
| 智能建议 | `getAIAdvice(dailyData, userProfile)` | **仅 localStorage** | 发送当日数据，返回个性化建议 |
| 每日食谱 | `getDailyMealPlan(userProfile, dailyTarget, todayIntakeContext)` | **仅 localStorage** | AI 规划全天饮食 + 训练计划 + 下一餐建议 |
| 连接测试 | `testApiConnection()` | 无 | 验证 API 连通性 |

### 持久化缓存

| 函数 | 存储键 | 存储位置 | 说明 |
|------|--------|----------|------|
| `saveAIAdvice(dateStr, data)` | `cc_ai_advice_YYYY-MM-DD` | **仅 localStorage** | 缓存 AI 建议 |
| `loadAIAdvice(dateStr)` | 同上 | **仅 localStorage** | 读取缓存 |
| `saveMealPlan(dateStr, data)` | `cc_mealplan_YYYY-MM-DD` | **仅 localStorage** | 缓存每日食谱 |
| `loadMealPlan(dateStr)` | 同上 | **仅 localStorage** | 读取缓存 |

### AI 功能日期可见性

| 日期 | AI 建议 | AI 食谱 Tab |
|------|---------|------------|
| 今天 | ✅ 显示 | ✅ 显示 |
| 未来 | ❌ 隐藏 | ✅ 显示（可提前规划） |
| 过去 | ❌ 隐藏 | ❌ 隐藏（Tab 隐藏，自动切回仪表盘） |

### 降级策略

- 代理模式 ON + 无用户 Key → 使用内置默认密钥（零配置）
- 用户填写自有 Key → 优先使用用户 Key
- API Key 未配置且非代理模式 → 提示用户启用代理或配置 Key
- 网络异常 → 友好提示 + 规则引擎仍然可用
- API 返回异常 → 显示错误，不影响规则建议

## 不依赖的项

- 无 npm 包
- 无构建工具
- 无第三方框架
- Cloudflare D1 + Pages Functions（唯一后端依赖）
