/**
 * Cloudflare Pages Function — DeepSeek API 代理
 * 路径: /api/deepseek/chat/completions
 *
 * 自动使用内置默认密钥转发请求到 DeepSeek API。
 * 如前端传了 Authorization header（用户自有 Key），优先使用用户 Key。
 */

// 默认 DeepSeek API Key（服务端持有，浏览器不可见）
const DEFAULT_API_KEY = 'YOUR_DEEPSEEK_API_KEY';
const UPSTREAM_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function onRequest(context) {
  const { request } = context;

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // 只允许 POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Allow': 'POST, OPTIONS',
      },
    });
  }

  try {
    // 读取前端请求体
    const body = await request.text();

    // 如果前端传了 Authorization，使用用户的 Key；否则使用默认 Key
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader ? authHeader.replace('Bearer ', '') : DEFAULT_API_KEY;

    const proxyRequest = new Request(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: body,
    });

    const response = await fetch(proxyRequest);

    // 返回流式响应（支持 SSE）
    const responseHeaders = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: '代理请求失败：' + e.message } }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
