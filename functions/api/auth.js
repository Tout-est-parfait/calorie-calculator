/**
 * 热量计算器 — 认证 API
 * POST /api/auth
 *
 * 请求格式（JSON body）：
 *   { "action": "register", "username": "...", "passwordHash": "...", "salt": "...", "userId": "..." }
 *   { "action": "login",    "username": "...", "passwordHash": "..." }
 *   { "action": "logout" }
 *   { "action": "validate" }
 *
 * D1 绑定：context.env.DB
 */

'use strict';

import { jsonResponse, errorResponse, handleOptions, validateSession } from '../_shared/auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  // OPTIONS 预检
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse('Invalid JSON body', 400);
  }

  const { action } = body;

  try {
    switch (action) {
      case 'register':
        return await handleRegister(db, body);
      case 'login':
        return await handleLogin(db, body);
      case 'logout':
        return await handleLogout(db, request);
      case 'validate':
        return await handleValidate(db, request);
      default:
        return errorResponse('Unknown action: ' + action, 400);
    }
  } catch (e) {
    console.error('Auth API error:', e);
    return errorResponse('Internal server error', 500);
  }
}

/** 用户注册 */
async function handleRegister(db, body) {
  const { username, passwordHash, salt, userId } = body;

  // 参数校验
  if (!username || !passwordHash || !salt || !userId) {
    return errorResponse('缺少必填参数：username, passwordHash, salt, userId', 400);
  }
  if (username.length > 20) {
    return errorResponse('用户名最长 20 个字符', 400);
  }

  // 检查用户名唯一性
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) {
    return errorResponse('用户名已被注册', 409);
  }

  // 插入用户
  await db.prepare(
    'INSERT INTO users (id, username, password_hash, salt) VALUES (?, ?, ?, ?)'
  ).bind(userId, username, passwordHash, salt).run();

  // 生成会话 token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(
    'INSERT INTO sessions (token, user_id, username, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, userId, username, expiresAt).run();

  return jsonResponse({
    success: true,
    token,
    userId,
    username,
  });
}

/**
 * 服务端 SHA-256 + 盐 哈希（与客户端 hashPassword 算法一致）
 */
async function serverHash(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 用户登录 */
async function handleLogin(db, body) {
  const { username, password, passwordHash } = body;

  if (!username || (!password && !passwordHash)) {
    return errorResponse('缺少用户名或密码', 400);
  }

  // 查找用户
  const user = await db.prepare(
    'SELECT id, username, password_hash, salt FROM users WHERE username = ?'
  ).bind(username).first();

  if (!user) {
    return errorResponse('用户名或密码错误', 401);
  }

  // 验证密码：优先服务端哈希（明文密码），兼容旧客户端预哈希
  let isValid = false;
  if (password) {
    // 明文密码：服务端用存储的盐做 SHA-256 哈希后比对
    const hash = await serverHash(password, user.salt);
    isValid = (hash === user.password_hash);
  } else if (passwordHash) {
    // 预哈希密码：直接比对（兼容旧客户端）
    isValid = (user.password_hash === passwordHash);
  }

  if (!isValid) {
    return errorResponse('用户名或密码错误', 401);
  }

  // 生成会话 token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(
    'INSERT INTO sessions (token, user_id, username, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(token, user.id, user.username, expiresAt).run();

  return jsonResponse({
    success: true,
    token,
    userId: user.id,
    username: user.username,
  });
}

/** 用户登出 */
async function handleLogout(db, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (token) {
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }

  return jsonResponse({ success: true });
}

/** 验证当前会话 */
async function handleValidate(db, request) {
  const session = await validateSession(db, request);
  if (!session) {
    return jsonResponse({ valid: false });
  }

  return jsonResponse({
    valid: true,
    userId: session.userId,
    username: session.username,
  });
}
