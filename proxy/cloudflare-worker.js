/**
 * 热量计算器 — Cloudflare Worker 代理
 * 将 /api/deepseek 转发到 DeepSeek API
 *
 * 使用方法：
 *   1. 在 Cloudflare Dashboard → Workers & Pages → 创建 Worker
 *   2. 粘贴此代码
 *   3. 运行 `npx wrangler secret put DEEPSEEK_API_KEY` 注入密钥
 *   4. 部署并绑定域名（或在应用中配置代理路径指向 Worker URL）
 *
 * 代理路径：
 *   DeepSeek:  /api/deepseek/chat/completions
 *
 * 注意：本文件不包含任何真实 API Key，请通过 Secret 配置。
 */

// ==================== 配置区 ====================
// 密钥通过 Cloudflare Worker Secret 注入
// 运行: npx wrangler secret put DEEPSEEK_API_KEY
// 如果没有注入密钥，Worker 会返回 500 错误提示配置
// ==============================================

const UPSTREAM_URL = 'https://api.deepseek.com/v1/chat/completions';

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

  // 路由匹配：/api/deepseek/chat/completions
  if (path !== '/api/deepseek/chat/completions') {
    return new Response('Not Found', { status: 404 });
  }

  // 从 Secret 或环境变量中读取 API Key
  const API_KEY = (typeof DEEPSEEK_API_KEY !== 'undefined') ? DEEPSEEK_API_KEY : '';

  if (!API_KEY || API_KEY.startsWith('YOUR_')) {
    return new Response(
      JSON.stringify({
        error: {
          message: '服务器未配置 API Key。请运行 `npx wrangler secret put DEEPSEEK_API_KEY` 注入密钥。\n获取地址：https://platform.deepseek.com/api_keys',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
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
      'Access-Control-Allow-Headers': 'Content-Type',
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
