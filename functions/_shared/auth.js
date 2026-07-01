/**
 * 热量计算器 — D1 共享鉴权模块
 * 供 functions/api/auth.js 和 functions/api/data/[[route]].js 共用
 *
 * 功能：
 *   1. validateSession(db, request) — 验证 Bearer token，返回用户信息或 null
 *   2. corsHeaders() — 统一的 CORS 响应头
 *   3. jsonResponse(data, status) — 构造 JSON 响应
 *   4. errorResponse(message, status) — 构造错误响应
 */

'use strict';

/** 统一 CORS 响应头 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

/** 构造 JSON 成功响应 */
function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: corsHeaders(),
  });
}

/** 构造 JSON 错误响应 */
function errorResponse(message, status) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: status || 400,
    headers: corsHeaders(),
  });
}

/** 处理 OPTIONS 预检请求 */
function handleOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/**
 * 验证会话 token
 * @param {D1Database} db — D1 数据库实例 (context.env.DB)
 * @param {Request} request — 原始请求对象
 * @returns {Promise<{userId: string, username: string}|null>}
 */
async function validateSession(db, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  try {
    const session = await db.prepare(
      'SELECT user_id, username, expires_at FROM sessions WHERE token = ?'
    ).bind(token).first();

    if (!session) return null;

    // 检查过期
    if (new Date(session.expires_at) < new Date()) {
      // 清理过期会话
      await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return null;
    }

    return { userId: session.user_id, username: session.username };
  } catch (e) {
    console.error('validateSession error:', e);
    return null;
  }
}

export { corsHeaders, jsonResponse, errorResponse, handleOptions, validateSession };
