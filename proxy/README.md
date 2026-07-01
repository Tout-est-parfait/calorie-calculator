# 热量计算器 — 代理配置指南

## 为什么需要代理？

浏览器出于安全策略，会阻止网页直接请求 `api.moonshot.cn` 等外部 API（CORS 限制）。解决方案是在服务器端部署一个反向代理：

```
浏览器 ──→ /api/kimi (同源，无 CORS) ──→ 代理服务器 ──→ Kimi API
```

**好处：**
- ✅ API Key 不暴露在浏览器中，更安全
- ✅ 无 CORS 限制，所有浏览器都能正常使用
- ✅ 可部署到 Cloudflare Pages / Cloudflare Worker / Nginx / Vercel / Netlify

---

## 方案一：Cloudflare Pages Function（推荐，已内置默认 Key）

本项目已内置 Cloudflare Pages Function，位于 `functions/api/kimi/chat/completions.js`。

部署到 Cloudflare Pages 后，代理路径为：`/api/kimi/chat/completions`（同源，无需完整 URL）

代码中已内置默认 Kimi API Key，无需额外配置即可使用。

如需使用自己的 Key：
1. 运行 `npx wrangler secret put KIMI_API_KEY` 注入密钥
2. 或在 `functions/api/kimi/chat/completions.js` 中修改 `DEFAULT_API_KEY`

---

## 方案二：Cloudflare Worker（独立部署）

### 1. 进入 Cloudflare Dashboard
Workers & Pages → 创建 Worker

### 2. 粘贴 `cloudflare-worker.js` 中的代码

代码中已内置默认 Kimi API Key，可直接部署使用。

### 3. （可选）覆盖默认密钥
```bash
npx wrangler secret put KIMI_API_KEY
```

### 4. 部署并绑定域名
- 点击「部署」
- （可选）在 Triggers 中绑定自定义域名

### 5. 在应用设置中
- 启用「代理模式」
- 代理路径填写 Worker URL + `/api/kimi/chat/completions`
  - 例如：`https://your-worker.your-subdomain.workers.dev/api/kimi/chat/completions`

---

## 方案三：本地 Nginx（推荐开发使用）

### 1. 复制配置文件
将 `nginx.conf` 中的 location 块放入你的 Nginx server 配置。

### 2. 修改密钥
```nginx
proxy_set_header Authorization "Bearer 你的Kimi API Key";
```

### 3. 启动 Nginx
```bash
nginx -s reload
```

### 4. 在应用设置中
- 启用「代理模式」
- 代理路径保持默认：`/api/kimi/chat/completions`
- 无需填写 API Key（密钥在 Nginx 配置中）

---

## 方案四：Vercel / Netlify

参考 `vercel.json`。注意：Vercel Rewrites 可能不支持注入自定义 Header，建议使用 Vercel Edge Functions 或 Netlify Functions 实现代理逻辑（参考 Cloudflare Worker 代码）。
