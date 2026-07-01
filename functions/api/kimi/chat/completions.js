/**
 * Cloudflare Pages Function — Kimi API 代理（月之暗面 Moonshot）
 * 路径: /api/kimi/chat/completions
 *
 * 内置默认密钥转发请求到 Kimi API。
 * 如前端传了 Authorization header（用户自有 Key），优先使用用户 Key。
 *
 * 密钥配置方式（三选一，按优先级排序）：
 *   1. 用户自带 Key — 前端设置页输入，通过 Authorization header 传递
 *   2. Cloudflare Pages Secret — 运行 `npx wrangler pages secret put KIMI_API_KEY` 注入（推荐）
 *   3. 本地开发 — 设置 KIMI_API_KEY 环境变量
 *
 * 注意：本文件不包含任何真实 API Key，请通过上述方式配置。
 */

const UPSTREAM_URL = 'https://api.moonshot.cn/v1/chat/completions';

export async function onRequest(context) {
  const { request, env } = context;

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

    // 密钥优先级：
    //   1. 前端传的 Authorization header（用户自己的 Key）
    //   2. Cloudflare Pages Secret — context.env.KIMI_API_KEY
    //   3. 都没有 → 返回错误提示
    const authHeader = request.headers.get('Authorization');
    let apiKey = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.replace('Bearer ', '');
    }

    // Cloudflare Pages: secrets 通过 context.env 传入
    if (!apiKey && env && env.KIMI_API_KEY) {
      apiKey = env.KIMI_API_KEY;
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: {
            message: '未配置 API Key。请在设置页面输入您的 Kimi API Key，或由管理员运行 `npx wrangler pages secret put KIMI_API_KEY` 配置服务端密钥。\n获取地址：https://platform.moonshot.cn/console/api-keys',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

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
