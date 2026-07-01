/**
 * 热量计算器 — 用户认证模块
 * Phase 10: 多用户登录系统
 *
 * 功能：
 *   1. 用户名 + 密码注册 / 登录
 *   2. 密码使用 Web Crypto API SHA-256 + 随机盐哈希存储
 *   3. 会话管理（localStorage 键 cc_session）
 *   4. 用户数据隔离（登录后 localStorage 键加 userId 前缀）
 *   5. 匿名模式（未登录时使用旧键名，向后兼容）
 *
 * 安全说明：
 *   - 纯前端方案，密码哈希存储在 localStorage 中
 *   - 定位是「防止数据混乱」而非金融级安全
 *   - 请勿使用重要密码
 */

'use strict';

// ==================== 用户存储 ====================

/** 用户列表存储键 */
const USERS_KEY = 'cc_users';

/** 会话存储键 */
const SESSION_KEY = 'cc_session';

/**
 * 读取所有注册用户
 * @returns {Array<{username: string, passwordHash: string, salt: string, userId: string, createdAt: string}>}
 */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 保存用户列表
 * @param {Array} users
 */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ==================== 密码工具 ====================

/**
 * 生成随机盐（hex 字符串）
 * @returns {string} 32 字符的 hex 盐
 */
function generateSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将字符串转为 ArrayBuffer（UTF-8 编码）
 * @param {string} str
 * @returns {Uint8Array}
 */
function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

/**
 * 将 ArrayBuffer 转为 hex 字符串
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 使用 SHA-256 + 盐 对密码进行哈希
 * @param {string} password — 明文密码
 * @param {string} salt — hex 格式的盐
 * @returns {Promise<string>} hex 格式的哈希值
 */
async function hashPassword(password, salt) {
  const data = stringToBuffer(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// ==================== 会话管理 ====================

/**
 * 保存当前登录会话
 * @param {object} user — { userId, username }
 */
function saveSession(user) {
  const session = {
    userId: user.userId,
    username: user.username,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * 清除当前会话
 */
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * 获取当前登录用户
 * @returns {object|null} { userId, username, loginTime } 或 null
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // 验证会话数据完整性
    if (!session.userId || !session.username) return null;
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * 是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// ==================== 用户操作 ====================

/**
 * 注册新用户
 * @param {string} username — 用户名（1-20 字符，仅允许中英文数字下划线）
 * @param {string} password — 密码（至少 4 字符）
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function registerUser(username, password) {
  // 验证用户名
  const trimmedName = username.trim();
  if (!trimmedName) {
    return { success: false, error: '请输入用户名' };
  }
  if (trimmedName.length > 20) {
    return { success: false, error: '用户名最多 20 个字符' };
  }
  if (!/^[\w一-龥]+$/.test(trimmedName)) {
    return { success: false, error: '用户名只能包含中文、英文、数字、下划线' };
  }

  // 验证密码
  if (!password || password.length < 4) {
    return { success: false, error: '密码至少 4 位' };
  }

  // 检查用户名是否已存在
  const users = loadUsers();
  if (users.some(u => u.username === trimmedName)) {
    return { success: false, error: '该用户名已被注册' };
  }

  // 哈希密码
  const salt = generateSalt();
  let passwordHash;
  try {
    passwordHash = await hashPassword(password, salt);
  } catch (e) {
    // Web Crypto API 不可用时降级（不推荐，但保证基本功能）
    // 使用简单拼接 + btoa 作为 fallback
    passwordHash = btoa(password + salt);
    console.warn('Web Crypto API 不可用，使用降级方案存储密码。建议使用 HTTPS 访问。');
  }

  // 创建用户
  const user = {
    username: trimmedName,
    passwordHash: passwordHash,
    salt: salt,
    userId: 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);

  // 自动登录（本地会话）
  saveSession({ userId: user.userId, username: user.username });

  // 尝试远程注册（D1 数据库同步）
  try {
    const remoteResult = await registerRemote(
      trimmedName, user.passwordHash, user.salt, user.userId
    );
    if (remoteResult.success) {
      console.log('远程注册成功，数据将跨设备同步');
    } else {
      console.warn('远程注册失败（可离线使用）:', remoteResult.error);
    }
  } catch (e) {
    console.warn('远程注册不可用（可离线使用）:', e.message);
  }

  return { success: true };
}

/**
 * 用户登录
 * 优先尝试远程登录（D1），支持跨设备登录
 * 发送明文密码到服务端（HTTPS 加密），服务端用存储的盐做哈希验证
 * 如果本地有用户数据，也先做本地密码验证作为快速路径
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function loginUser(username, password) {
  const trimmedName = username.trim();

  if (!trimmedName || !password) {
    return { success: false, error: '请输入用户名和密码' };
  }

  let loggedIn = false;
  let userId = '';
  let fromRemote = false;

  // 第一步：尝试远程登录（D1 数据库）
  // 发送明文密码，服务端用存储的盐做 SHA-256 哈希后验证
  // 优点：支持跨设备、新设备无需知道注册时的盐值
  try {
    const remoteResult = await loginRemote(trimmedName, password);
    if (remoteResult.success) {
      loggedIn = true;
      userId = remoteResult.userId;
      fromRemote = true;
    } else {
      // 远程明确返回失败（用户名不存在或密码错误）
      return { success: false, error: remoteResult.error || '用户名不存在或密码错误' };
    }
  } catch (e) {
    // 远程不可用（网络错误等），降级到本地验证
    console.warn('远程登录不可用，使用本地验证:', e.message);
  }

  // 第二步：如果远程登录失败或不可用，尝试本地密码验证
  if (!loggedIn) {
    const users = loadUsers();
    const user = users.find(u => u.username === trimmedName);

    if (!user) {
      return { success: false, error: '用户名不存在' };
    }

    let isValid = false;
    try {
      const hash = await hashPassword(password, user.salt);
      isValid = (hash === user.passwordHash);
    } catch (e) {
      const fallbackHash = btoa(password + user.salt);
      isValid = (fallbackHash === user.passwordHash);
    }

    if (!isValid) {
      return { success: false, error: '密码错误' };
    }

    userId = user.userId;
    loggedIn = true;
  }

  // 保存本地会话
  saveSession({ userId: userId, username: trimmedName });

  // 如果远程登录成功，从 D1 拉取最新数据
  if (fromRemote) {
    try {
      await syncFromServer();
      console.log('已从云端同步数据');
    } catch (e) {
      console.warn('云端数据同步失败:', e.message);
    }
  }

  return { success: true };
}

/**
 * 退出登录
 * 清除本地会话 + 远程会话
 */
async function logoutUser() {
  // 远程登出
  try {
    await logoutRemote();
  } catch (e) { /* ignore */ }
  clearSession();
}

// ==================== 数据隔离 ====================

/**
 * 根据当前登录状态，返回完整的 localStorage 键名
 *
 * 匿名模式（未登录）：返回原键名（如 "cc_records_2026-06-29"）
 * 登录模式：在 "cc_" 后插入 userId（如 "cc_u123_records_2026-06-29"）
 *
 * @param {string} baseKey — 基础键名（必须以 "cc_" 开头）
 * @returns {string} 完整的 localStorage 键名
 */
function storageKey(baseKey) {
  const user = getCurrentUser();
  if (!user) return baseKey;
  // 将 "cc_" 替换为 "cc_{userId}_"
  return baseKey.replace(/^cc_/, 'cc_' + user.userId + '_');
}
