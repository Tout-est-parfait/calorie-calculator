# 技术说明

## 技术选型

| 项 | 选择 | 原因 |
|----|------|------|
| 前端框架 | 无框架，纯 HTML + CSS + JS | 无需构建工具，小白可维护 |
| CSS 方案 | 原生 CSS（CSS 变量 + Flexbox + Grid） | 零依赖，移动端友好 |
| 数据存储 | localStorage | 离线可用，无需后端 |
| 图标 | Emoji / SVG 内嵌 | 不依赖图标库 |

## 项目结构

```
热量计算器/
├── index.html              # 主页面（唯一页面，SPA 模式）
├── css/
│   └── style.css           # 样式文件（~2200 行）
├── js/
│   ├── app.js              # 应用入口，初始化与协调（3Tab导航 + 视图切换）
│   ├── food-database.js    # 内置食物数据库（173 种食物，8 个分类）
│   ├── auth.js             # 用户认证（注册/登录/会话/数据隔离）
│   ├── api.js              # DeepSeek API 集成（食物估计 + AI建议 + 每日食谱）
│   ├── settings.js         # 用户设置（BMR + 热量目标 + API Key + 代理模式）
│   ├── custom-food.js      # 自定义食物 CRUD
│   ├── dashboard.js        # 仪表盘渲染（环形进度条 + 营养素卡片 + 供能比例条）
│   ├── advisor.js          # 科学建议引擎（规则引擎 + AI深度分析 + AI食谱计划）
│   ├── history.js          # 历史记录管理（7 天统计 + 日期列表）
├── functions/              # Cloudflare Pages Functions（服务端API代理）
│   └── api/deepseek/chat/completions.js  # DeepSeek API 代理（内置默认密钥）
├── proxy/                  # 代理配置参考文件（非 Cloudflare 部署用）
│   ├── nginx.conf
│   ├── cloudflare-worker.js
│   ├── vercel.json
│   └── README.md
├── docs/                   # 项目文档
├── development-logs/       # 开发日志
└── CLAUDE.md               # 开发指引
```

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

### 摄入记录（localStorage）

键名：`cc_records_YYYY-MM-DD`（如 `cc_records_2026-06-29`）

```js
// 值为 JSON 数组，每条记录：
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

### 用户设置（localStorage，键名 `cc_settings`）

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

- 使用 localStorage 存储所有用户数据
- 键名规范：`cc_` 前缀（Calorie Calculator）
- 登录用户自动添加 `cc_{userId}_*` 前缀隔离数据

| 键名格式 | 内容 | 说明 |
|----------|------|------|
| `cc_records_YYYY-MM-DD` | JSON 数组 | 每日摄入记录 |
| `cc_settings` | JSON 对象 | 用户设置（目标/身体数据/热量） |
| `cc_custom_foods` | JSON 数组 | 用户自定义食物 |
| `cc_apikey_deepseek` | string | DeepSeek API Key（可选） |
| `cc_proxy_mode` | boolean | 代理模式开关 |
| `cc_proxy_path` | string | 代理路径 |
| `cc_ai_advice_YYYY-MM-DD` | JSON 对象 | AI 深度分析结果（按日期缓存） |
| `cc_mealplan_YYYY-MM-DD` | JSON 对象 | AI 每日食谱计划（按日期缓存） |

- 历史模块通过扫描 `cc_records_*` 前缀的键来枚举所有有记录的日期
- 历史统计只计算有记录的天数，无记录的日期不参与均值计算
- AI 建议和食谱按日期缓存，切换日期自动加载对应缓存，避免重复消耗 API tokens

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

## 多用户登录系统（Phase 10）

### 用户存储

键名：`cc_users`

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

键名：`cc_session`

```json
{
  "userId": "u_xxx",
  "username": "用户名",
  "loginTime": "ISO时间戳"
}
```

### 数据隔离

- 匿名模式：使用旧键名格式（`cc_records_YYYY-MM-DD`、`cc_settings`、`cc_custom_foods`）
- 登录模式：在 `cc_` 后插入 `{userId}_`（如 `cc_u123_records_YYYY-MM-DD`）
- 通过 `storageKey(baseKey)` 函数自动切换

### 密码安全

- 使用 Web Crypto API `SHA-256` + 随机盐（`crypto.getRandomValues`）做哈希
- 定位是「防止数据混乱」而非金融级安全

## DeepSeek API 集成

### 端点与模式

- API 端点：`https://api.deepseek.com/v1/chat/completions`
- 模型：`deepseek-chat`（可自定义）
- 代理端点：`/api/deepseek/chat/completions`（同源路径）

**两种工作模式：**

| 模式 | 请求路径 | Authorization | 适用场景 |
|------|----------|---------------|----------|
| 代理模式 | 同源 `/api/deepseek/chat/completions` | 服务端附加默认密钥 | 零配置、安全（推荐） |
| 直接模式 | `https://api.deepseek.com/v1/chat/completions` | 浏览器携带用户 Key | 用户使用自有 Key |

**默认密钥安全设计：**
- 密钥仅存储在服务端 `functions/api/deepseek/chat/completions.js`
- 前端代码中不包含密钥的任何片段
- `functions/proxy/[[path]].js` 拦截 `/proxy/*` 路径，防止配置文件泄漏
- 代理模式下用户无需填写任何 API Key 即可使用所有 AI 功能

### AI 功能

| 功能 | 函数 | 说明 |
|------|------|------|
| 食物估计 | `estimateFood(description)` | 自然语言描述食物，返回营养估计JSON |
| 智能建议 | `getAIAdvice(dailyData, userProfile)` | 发送当日数据，返回个性化建议 |
| 每日食谱 | `getDailyMealPlan(userProfile, dailyTarget)` | AI 规划全天饮食 + 训练计划 |
| 连接测试 | `testApiConnection()` | 验证 API 连通性 |

### 持久化缓存

| 函数 | 存储键 | 说明 |
|------|--------|------|
| `saveAIAdvice(dateStr, data)` | `cc_ai_advice_YYYY-MM-DD` | 缓存 AI 建议 |
| `loadAIAdvice(dateStr)` | 同上 | 读取缓存，无需重请求 |
| `saveMealPlan(dateStr, data)` | `cc_mealplan_YYYY-MM-DD` | 缓存每日食谱 |
| `loadMealPlan(dateStr)` | 同上 | 读取缓存 |

### 降级策略

- 代理模式 ON + 无用户 Key → 使用内置默认密钥（零配置）
- 用户填写自有 Key → 优先使用用户 Key
- API Key 未配置且非代理模式 → 提示用户启用代理或配置 Key
- 网络异常 → 友好提示 + 规则引擎仍然可用
- API 返回异常 → 显示错误，不影响规则建议

## 不依赖的项

- 无后端服务
- 无数据库
- 可选第三方 API（DeepSeek，用户自备Key）
- 无 npm 包
- 无构建工具
