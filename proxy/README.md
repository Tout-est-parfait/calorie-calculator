# 热量计算器 — 代理配置指南

## 为什么需要代理？

浏览器出于安全策略，会阻止网页直接请求 `api.deepseek.com` 等外部 API（CORS 限制）。解决方案是在服务器端部署一个反向代理：

```
浏览器 ──→ /api/deepseek (同源，无 CORS) ──→ 代理服务器 ──→ DeepSeek API
```

**好处：**
- ✅ API Key 不暴露在浏览器中，更安全
- ✅ 无 CORS 限制，所有浏览器都能正常使用
- ✅ 可部署到 Nginx / Cloudflare / Vercel / Netlify

---

## 方案一：本地 Nginx（推荐开发使用）

### 1. 复制配置文件
将 `nginx.conf` 中的 location 块放入你的 Nginx server 配置。

### 2. 修改密钥
```nginx
proxy_set_header Authorization "Bearer 你的真实API Key";
```

### 3. 启动 Nginx
```bash
nginx -s reload
```

### 4. 在应用设置中
- 启用「代理模式」
- 代理路径保持默认：`/api/deepseek/chat/completions`
- 无需填写 API Key（密钥在 Nginx 配置中）

---

## 方案二：Cloudflare Worker（推荐线上使用）

### 1. 进入 Cloudflare Dashboard
Workers & Pages → 创建 Worker

### 2. 粘贴 `cloudflare-worker.js` 中的代码

### 3. 修改密钥
```js
const API_KEY = 'sk-xxxxxxxxxxxxx';     // 你的 DeepSeek Key
```

### 4. 部署并绑定域名
- 点击「部署」
- （可选）在 Triggers 中绑定自定义域名

### 5. 在应用设置中
- 启用「代理模式」
- 代理路径填写 Worker URL + `/api/deepseek/chat/completions`
  - 例如：`https://your-worker.your-subdomain.workers.dev/api/deepseek/chat/completions`

---

## 方案三：直接部署到 Cloudflare Pages + Worker

将本项目部署到 Cloudflare Pages，同时将上述 Worker 绑定到同一域名：

```
your-app.pages.dev/api/deepseek → Worker 转发 → DeepSeek
```

代理路径填写：`/api/deepseek/chat/completions`（同源，无需完整 URL）

---

## 方案四：Vercel / Netlify

参考 `vercel.json`。注意：Vercel Rewrites 可能不支持注入自定义 Header，建议使用 Vercel Edge Functions 或 Netlify Functions 实现代理逻辑（参考 Cloudflare Worker 代码）。
