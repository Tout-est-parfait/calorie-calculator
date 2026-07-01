/**
 * 热量计算器 — Cloudflare Worker 代理
 * 将 /api/kimi 转发到 Kimi API（月之暗面 Moonshot）
 *
 * 使用方法：
 *   1. 在 Cloudflare Dashboard → Workers & Pages → 创建 Worker
 *   2. 粘贴此代码（代码中已内置默认 API Key）
 *   3. （可选）运行 `npx wrangler secret put KIMI_API_KEY` 覆盖默认密钥
 *   4. 部署并绑定域名（或在应用中配置代理路径指向 Worker URL）
 *
 * 代理路径：
 *   Kimi:  /api/kimi/chat/completions
 *   DeepSeek（旧，向后兼容）: /api/deepseek/chat/completions
 *
 * 注意：代码中已内置默认 Kimi API Key。如需更换，修改 DEFAULT_API_KEY 或通过 Secret 覆盖。
 */

// ==================== 配置区 ====================
// 内置默认密钥，如需更换请修改此处
// 或运行: npx wrangler secret put KIMI_API_KEY 覆盖
// ==============================================

const UPSTREAM_URL = 'https://api.moonshot.cn/v1/chat/completions';
const DEFAULT_API_KEY = 'sk-OaVZ418bWB5nmPB9KQBduwW1QEg6hiFcYehHIAHu53vMGRaL';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 只处理 POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 路由匹配：支持新路径 /api/kimi/chat/completions 和旧路径 /api/deepseek/chat/completions
  if (path !== '/api/kimi/chat/completions' && path !== '/api/deepseek/chat/completions') {
    return new Response('Not Found', { status: 404 });
  }

  // 密钥优先级：
  //   1. Cloudflare Worker Secret — KIMI_API_KEY
  //   2. 内置默认 Key
  let API_KEY = (typeof KIMI_API_KEY !== 'undefined') ? KIMI_API_KEY : '';
  if (!API_KEY) {
    API_KEY = DEFAULT_API_KEY;
  }

  // 读取前端发来的请求体并转发
  const body = await request.text();

  const proxyRequest = new Request(UPSTREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY,
    },
    body: body,
  });

  try {
    const response = await fetch(proxyRequest);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...corsHeaders,
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: '代理请求失败：' + e.message } }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
