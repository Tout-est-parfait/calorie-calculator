/**
 * 热量计算器 — Cloudflare Worker 代理（参考文件）
 * 将 /api/kimi 转发到 Kimi API（月之暗面 Moonshot）
 *
 * 注意：部署前请通过以下方式配置密钥：
 *   方法一（推荐）：运行 `npx wrangler secret put KIMI_API_KEY` 注入密钥
 *   方法二：本地开发时设置 KIMI_API_KEY 环境变量
 *
 * 本文件不包含任何真实 API Key，请勿将密钥写入代码。
 *
 * 代理路径：
 *   Kimi（推荐）:  /api/kimi/chat/completions
 *   DeepSeek（旧，向后兼容）:  /api/deepseek/chat/completions
 */

const UPSTREAM_URL = 'https://api.moonshot.cn/v1/chat/completions';

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

  // 从 Secret 读取 API Key（不硬编码在代码中）
  // 部署前运行: npx wrangler secret put KIMI_API_KEY
  const API_KEY = (typeof KIMI_API_KEY !== 'undefined') ? KIMI_API_KEY : '';

  if (!API_KEY) {
    return new Response(
      JSON.stringify({
        error: {
          message: '服务器未配置 API Key。请运行 `npx wrangler secret put KIMI_API_KEY` 注入密钥。\n获取地址：https://platform.moonshot.cn/console/api-keys',
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
