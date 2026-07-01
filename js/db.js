/**
 * 热量计算器 — D1 数据访问层
 * Phase 12: Cloudflare D1 数据库集成
 *
 * 策略：D1 为主存储，localStorage 为离线缓存
 *   - 每次操作先请求 D1 API，成功则更新 localStorage 缓存
 *   - 网络失败时使用 localStorage 缓存，写入操作加入待同步队列
 *   - 匿名用户（无 session token）直接使用 localStorage，不发起 API 请求
 *
 * 全局依赖：storageKey()（来自 auth.js）、getCurrentUser()（来自 auth.js）
 */

'use strict';

const API_BASE = '/api/data';
const AUTH_API = '/api/auth';

// ═══════════════════════════════════════════════════
// Session Token 管理
// ═══════════════════════════════════════════════════

/** 获取当前 session token */
function getSessionToken() {
  // 优先从 sessionStorage 读取，其次 localStorage
  let t = sessionStorage.getItem('cc_session_token');
  if (!t) {
    t = localStorage.getItem('cc_session_token');
    if (t) sessionStorage.setItem('cc_session_token', t);
  }
  return t || '';
}

/** 保存 session token（双写） */
function setSessionToken(token) {
  if (token) {
    sessionStorage.setItem('cc_session_token', token);
    localStorage.setItem('cc_session_token', token);
  } else {
    clearSessionToken();
  }
}

/** 清除 session token */
function clearSessionToken() {
  sessionStorage.removeItem('cc_session_token');
  localStorage.removeItem('cc_session_token');
}

/** 是否有有效 session（已登录且非匿名） */
function hasSession() {
  return !!getSessionToken();
}

// ═══════════════════════════════════════════════════
// 通用 API 请求
// ═══════════════════════════════════════════════════

/**
 * 发起 API 请求
 * @param {string} method - HTTP 方法
 * @param {string} baseUrl - API 基础路径 (API_BASE 或 AUTH_API)
 * @param {string} path - 子路径
 * @param {object|null} body - 请求体（GET 时忽略）
 * @param {object} params - URL 查询参数
 * @returns {Promise<object>} 解析后的 JSON 响应
 */
async function apiRequest(method, baseUrl, path, body, params) {
  let url = baseUrl;
  if (path) url += '/' + path;

  // 附加查询参数
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += '?' + qs;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getSessionToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opts = { method, headers };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const response = await fetch(url, opts);

  if (!response.ok) {
    // 401 表示会话过期，清除 token
    if (response.status === 401) {
      clearSessionToken();
    }
    let errorText = '服务器错误';
    try {
      const errData = await response.json();
      errorText = errData.error || errorText;
    } catch (e) { /* ignore */ }
    throw new Error(errorText);
  }

  return response.json();
}

/** GET 请求快捷方法 */
async function apiGet(path, params) {
  return apiRequest('GET', API_BASE, path, null, params);
}

/** POST 请求快捷方法 */
async function apiPost(path, body) {
  return apiRequest('POST', API_BASE, path, body, null);
}

/** PUT 请求快捷方法 */
async function apiPut(path, body) {
  return apiRequest('PUT', API_BASE, path, body, null);
}

/** DELETE 请求快捷方法 */
async function apiDelete(path, body) {
  return apiRequest('DELETE', API_BASE, path, body, null);
}

// ═══════════════════════════════════════════════════
// Auth API（供 auth.js 调用）
// ═══════════════════════════════════════════════════

/**
 * 远程注册
 * @returns {Promise<{success: boolean, token?: string, userId?: string, error?: string}>}
 */
async function registerRemote(username, passwordHash, salt, userId) {
  try {
    const result = await apiRequest('POST', AUTH_API, '', {
      action: 'register',
      username,
      passwordHash,
      salt,
      userId,
    }, null);

    if (result.success && result.token) {
      setSessionToken(result.token);
    }
    return result;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * 远程登录
 * @param {string} username
 * @param {string} password — 明文密码（通过 HTTPS 加密传输，服务端用存储的盐验证）
 * @returns {Promise<{success: boolean, token?: string, userId?: string, error?: string}>}
 */
async function loginRemote(username, password) {
  try {
    const result = await apiRequest('POST', AUTH_API, '', {
      action: 'login',
      username,
      password,
    }, null);

    if (result.success && result.token) {
      setSessionToken(result.token);
    }
    return result;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * 远程登出
 */
async function logoutRemote() {
  try {
    await apiRequest('POST', AUTH_API, '', { action: 'logout' }, null);
  } catch (e) {
    // 即使服务端登出失败，也清除本地 token
  }
  clearSessionToken();
}

/**
 * 验证当前会话是否有效
 * @returns {Promise<{valid: boolean, userId?: string, username?: string}>}
 */
async function validateSessionRemote() {
  try {
    return await apiRequest('POST', AUTH_API, '', { action: 'validate' }, null);
  } catch (e) {
    return { valid: false };
  }
}

// ═══════════════════════════════════════════════════
// 离线队列管理
// ═══════════════════════════════════════════════════

/**
 * 将失败的写入操作加入待同步队列
 */
function markPendingSync(type, data) {
  const key = storageKey('cc_pending_sync');
  try {
    const queue = JSON.parse(localStorage.getItem(key) || '[]');
    queue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem(key, JSON.stringify(queue));
  } catch (e) { /* ignore */ }
}

/**
 * 重放待同步队列中的操作
 * @returns {Promise<number>} 成功同步的操作数
 */
async function processPendingSync() {
  if (!hasSession()) return 0;

  const key = storageKey('cc_pending_sync');
  let queue;
  try {
    queue = JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) { queue = []; }

  if (queue.length === 0) return 0;

  let successCount = 0;
  for (const item of [...queue]) {
    try {
      switch (item.type) {
        case 'add-record':
          await apiPost('records', item.data);
          break;
        case 'delete-record':
          await apiDelete('records', item.data);
          break;
        case 'custom-food':
          await apiPost('custom-foods', item.data);
          break;
        case 'delete-custom-food':
          await apiDelete('custom-foods', item.data);
          break;
        case 'settings':
          await apiPut('settings', item.data);
          break;
        case 'ai-cache':
          await apiPost('ai-cache', item.data);
          break;
      }
      successCount++;
    } catch (e) {
      break; // 仍然离线，停止重试
    }
  }

  // 移除已成功同步的项
  queue.splice(0, successCount);
  localStorage.setItem(key, JSON.stringify(queue));
  return successCount;
}

// ═══════════════════════════════════════════════════
// 记录字段名规范化
// D1 返回 snake_case，客户端使用 camelCase，此函数统一转换
// ═══════════════════════════════════════════════════

/**
 * 将 D1 返回的记录字段从 snake_case 转为 camelCase
 * 兼容已经是 camelCase 的记录（localStorage缓存）
 */
function normalizeRecord(r) {
  return {
    id: r.id || '',
    foodId: r.food_id || r.foodId || '',
    foodName: r.food_name || r.foodName || '',
    category: r.category || '',
    grams: r.grams || 0,
    servingLabel: r.serving_label || r.servingLabel || '',
    calories: r.calories || 0,
    carbs: r.carbs || 0,
    protein: r.protein || 0,
    fat: r.fat || 0,
    time: r.time || '',
    created_at: r.created_at || '',
    record_date: r.record_date || '',
    user_id: r.user_id || '',
  };
}

// ═══════════════════════════════════════════════════
// 饮食记录 CRUD
// ═══════════════════════════════════════════════════

/**
 * 获取某日的饮食记录（D1 优先，localStorage 兜底）
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Promise<Array>}
 */
async function getRecordsDB(dateStr) {
  const cacheKey = storageKey('cc_records_' + dateStr);

  if (!hasSession()) {
    // 匿名用户：直接用 localStorage
    try { return JSON.parse(localStorage.getItem(cacheKey)) || []; }
    catch (e) { return []; }
  }

  try {
    const result = await apiGet('records', { date: dateStr });
    if (result.records) {
      // 将 D1 的 snake_case 字段转为 camelCase
      const normalized = result.records.map(normalizeRecord);
      // 更新本地缓存
      localStorage.setItem(cacheKey, JSON.stringify(normalized));
      return normalized;
    }
    return [];
  } catch (e) {
    // 网络失败，使用 localStorage 缓存
    console.warn('D1 unavailable, using localStorage cache:', e.message);
    try { return JSON.parse(localStorage.getItem(cacheKey)) || []; }
    catch (err) { return []; }
  }
}

/**
 * 添加一条饮食记录
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {object} record - 记录对象
 * @returns {Promise<boolean>} 是否成功
 */
async function addRecordDB(dateStr, record) {
  const cacheKey = storageKey('cc_records_' + dateStr);

  // 先更新 localStorage（即时 UI 响应）
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    cached.push(record);
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (e) { /* ignore */ }

  if (!hasSession()) return true;

  // 异步推送到 D1
  try {
    await apiPost('records', { date: dateStr, record });
    return true;
  } catch (e) {
    markPendingSync('add-record', { date: dateStr, record });
    console.warn('Record saved locally, will sync when online:', e.message);
    return false;
  }
}

/**
 * 删除一条饮食记录
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} recordId - 记录 ID
 * @returns {Promise<boolean>}
 */
async function deleteRecordDB(dateStr, recordId) {
  const cacheKey = storageKey('cc_records_' + dateStr);

  // 先从 localStorage 移除
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updated = cached.filter(r => r.id !== recordId);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch (e) { /* ignore */ }

  if (!hasSession()) return true;

  try {
    await apiDelete('records', { date: dateStr, recordId });
    return true;
  } catch (e) {
    markPendingSync('delete-record', { date: dateStr, recordId });
    console.warn('Delete saved locally, will sync when online:', e.message);
    return false;
  }
}

/**
 * 获取历史记录汇总（所有日期的统计）
 * @returns {Promise<Array>}
 */
async function getRecordSummariesDB() {
  if (!hasSession()) {
    // 匿名用户：扫描 localStorage
    return getAllDaySummariesLocal();
  }

  try {
    const result = await apiGet('records/summaries', null);
    return result.summaries || [];
  } catch (e) {
    console.warn('D1 unavailable for summaries, using localStorage:', e.message);
    return getAllDaySummariesLocal();
  }
}

/** 从 localStorage 扫描所有日期的汇总（匿名/离线回退） */
function getAllDaySummariesLocal() {
  const prefix = storageKey('cc_records_');
  const summaries = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const records = JSON.parse(localStorage.getItem(key)) || [];
        if (records.length > 0) {
          const recordDate = key.replace(prefix, '');
          summaries.push({
            record_date: recordDate,
            count: records.length,
            total_cal: records.reduce((s, r) => s + (r.calories || 0), 0),
            total_carbs: records.reduce((s, r) => s + (r.carbs || 0), 0),
            total_protein: records.reduce((s, r) => s + (r.protein || 0), 0),
            total_fat: records.reduce((s, r) => s + (r.fat || 0), 0),
          });
        }
      } catch (e) { /* skip corrupted data */ }
    }
  }
  return summaries.sort((a, b) => b.record_date.localeCompare(a.record_date));
}

// ═══════════════════════════════════════════════════
// 自定义食物 CRUD
// ═══════════════════════════════════════════════════

/**
 * 获取用户自定义食物
 * @returns {Promise<Array>}
 */
async function getCustomFoodsDB() {
  const cacheKey = storageKey('cc_custom_foods');

  if (!hasSession()) {
    try { return JSON.parse(localStorage.getItem(cacheKey)) || []; }
    catch (e) { return []; }
  }

  try {
    const result = await apiGet('custom-foods', null);
    if (result.foods) {
      localStorage.setItem(cacheKey, JSON.stringify(result.foods));
      return result.foods;
    }
    return [];
  } catch (e) {
    try { return JSON.parse(localStorage.getItem(cacheKey)) || []; }
    catch (err) { return []; }
  }
}

/**
 * 添加自定义食物
 * @param {object} food - 食物对象
 * @returns {Promise<boolean>}
 */
async function addCustomFoodDB(food) {
  const cacheKey = storageKey('cc_custom_foods');

  // 先更新本地缓存
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    cached.push(food);
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (e) { /* ignore */ }

  if (!hasSession()) return true;

  try {
    await apiPost('custom-foods', food);
    return true;
  } catch (e) {
    markPendingSync('custom-food', food);
    return false;
  }
}

/**
 * 删除自定义食物
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteCustomFoodDB(id) {
  const cacheKey = storageKey('cc_custom_foods');

  // 先从本地移除
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updated = cached.filter(f => f.id !== id);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch (e) { /* ignore */ }

  if (!hasSession()) return true;

  try {
    await apiDelete('custom-foods', { id });
    return true;
  } catch (e) {
    markPendingSync('delete-custom-food', { id });
    return false;
  }
}

// ═══════════════════════════════════════════════════
// 用户设置 CRUD
// ═══════════════════════════════════════════════════

/**
 * 获取用户设置（D1 优先，localStorage 兜底）
 * @returns {Promise<object|null>}
 */
async function getSettingsDB() {
  const cacheKey = storageKey('cc_settings');

  if (!hasSession()) {
    try { return JSON.parse(localStorage.getItem(cacheKey)); }
    catch (e) { return null; }
  }

  try {
    const result = await apiGet('settings', null);
    if (result.settings) {
      localStorage.setItem(cacheKey, JSON.stringify(result.settings));
      return result.settings;
    }
    // 服务端无数据，尝试本地
    try { return JSON.parse(localStorage.getItem(cacheKey)); }
    catch (e) { return null; }
  } catch (e) {
    try { return JSON.parse(localStorage.getItem(cacheKey)); }
    catch (err) { return null; }
  }
}

/**
 * 保存用户设置
 * @param {object} settings - 完整设置对象
 * @returns {Promise<boolean>}
 */
async function saveSettingsDB(settings) {
  const cacheKey = storageKey('cc_settings');

  // 先更新本地
  localStorage.setItem(cacheKey, JSON.stringify(settings));

  if (!hasSession()) return true;

  try {
    await apiPut('settings', settings);
    return true;
  } catch (e) {
    markPendingSync('settings', settings);
    return false;
  }
}

// ═══════════════════════════════════════════════════
// AI 缓存 CRUD
// ═══════════════════════════════════════════════════

/**
 * 获取缓存的 AI 响应
 * @param {'advice'|'mealplan'} cacheType
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Promise<object|null>}
 */
async function getAICacheDB(cacheType, dateStr) {
  const cacheKey = storageKey('cc_' + (cacheType === 'advice' ? 'ai_advice_' : 'mealplan_') + dateStr);

  if (!hasSession()) {
    try { return JSON.parse(localStorage.getItem(cacheKey)); }
    catch (e) { return null; }
  }

  try {
    const result = await apiGet('ai-cache', { type: cacheType, date: dateStr });
    if (result.data) {
      // 包装成与现有 loadAIAdvice/loadMealPlan 兼容的格式
      const wrapped = { data: result.data, savedAt: result.savedAt };
      localStorage.setItem(cacheKey, JSON.stringify(wrapped));
      return wrapped;
    }
    // 服务端无缓存，尝试本地
    try { return JSON.parse(localStorage.getItem(cacheKey)); }
    catch (e) { return null; }
  } catch (e) {
    try { return JSON.parse(localStorage.getItem(cacheKey)); }
    catch (err) { return null; }
  }
}

/**
 * 保存 AI 缓存
 * @param {'advice'|'mealplan'} cacheType
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {object} data - AI 响应数据
 * @returns {Promise<boolean>}
 */
async function saveAICacheDB(cacheType, dateStr, data) {
  const cacheKey = storageKey('cc_' + (cacheType === 'advice' ? 'ai_advice_' : 'mealplan_') + dateStr);

  // 包装并保存到本地
  const wrapped = { data, savedAt: Date.now() };
  localStorage.setItem(cacheKey, JSON.stringify(wrapped));

  if (!hasSession()) return true;

  try {
    await apiPost('ai-cache', { type: cacheType, date: dateStr, data });
    return true;
  } catch (e) {
    markPendingSync('ai-cache', { type: cacheType, date: dateStr, data });
    return false;
  }
}

// ═══════════════════════════════════════════════════
// 全量同步
// ═══════════════════════════════════════════════════

/**
 * 从 D1 下载所有数据，刷新 localStorage
 * 用于：登录后首次同步、跨设备数据拉取
 * @returns {Promise<boolean>}
 */
async function syncFromServer() {
  if (!hasSession()) return false;

  try {
    const result = await apiGet('sync', null);
    if (!result.records && !result.customFoods) return false;

    // 写入饮食记录
    if (result.records) {
      for (const [date, records] of Object.entries(result.records)) {
        const cacheKey = storageKey('cc_records_' + date);
        const normalized = records.map(normalizeRecord);
        localStorage.setItem(cacheKey, JSON.stringify(normalized));
      }
    }

    // 写入自定义食物
    if (result.customFoods) {
      const cacheKey = storageKey('cc_custom_foods');
      const foods = result.customFoods.map(f => ({
        id: f.id, name: f.name, category: 'custom',
        cal: f.cal, carbs: f.carbs, protein: f.protein, fat: f.fat,
        servings: [
          { label: '100g', g: 100 },
          { label: '50g', g: 50 },
          { label: '200g', g: 200 },
        ],
      }));
      localStorage.setItem(cacheKey, JSON.stringify(foods));
    }

    // 写入设置
    if (result.settings) {
      const cacheKey = storageKey('cc_settings');
      localStorage.setItem(cacheKey, JSON.stringify(result.settings));
    }

    // 写入 AI 缓存
    if (result.aiCache) {
      for (const c of result.aiCache) {
        if (!c.data) continue;
        const key = storageKey('cc_' + (c.type === 'advice' ? 'ai_advice_' : 'mealplan_') + c.date);
        localStorage.setItem(key, JSON.stringify({ data: c.data, savedAt: c.savedAt }));
      }
    }

    // 标记已同步
    localStorage.setItem(storageKey('cc_synced_to_d1'), 'true');
    return true;
  } catch (e) {
    console.warn('Sync from server failed:', e.message);
    return false;
  }
}

/**
 * 迁移：将 localStorage 中现有数据上传到 D1
 * 在用户首次登录新版本时自动调用
 * @returns {Promise<boolean>}
 */
async function migrateToServer() {
  if (!hasSession()) return false;

  // 检查是否已迁移过
  if (localStorage.getItem(storageKey('cc_migrated_to_d1'))) return true;

  try {
    // 收集所有本地数据
    const payload = {
      records: collectAllRecordsLocal(),
      customFoods: collectCustomFoodsLocal(),
      settings: collectSettingsLocal(),
      aiCache: collectAllAICacheLocal(),
    };

    const result = await apiPost('sync', payload);
    if (result.success) {
      localStorage.setItem(storageKey('cc_migrated_to_d1'), 'true');
      console.log('Migration to D1 complete:', result.migrated);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Migration to D1 failed, will retry:', e.message);
    return false;
  }
}

/** 收集所有 local 饮食记录 */
function collectAllRecordsLocal() {
  const prefix = storageKey('cc_records_');
  const records = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const date = key.replace(prefix, '');
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data) && data.length > 0) {
          records[date] = data;
        }
      } catch (e) { /* skip */ }
    }
  }
  return records;
}

/** 收集本地自定义食物 */
function collectCustomFoodsLocal() {
  try {
    return JSON.parse(localStorage.getItem(storageKey('cc_custom_foods'))) || [];
  } catch (e) { return []; }
}

/** 收集本地设置 */
function collectSettingsLocal() {
  try {
    return JSON.parse(localStorage.getItem(storageKey('cc_settings')));
  } catch (e) { return null; }
}

/** 收集本地 AI 缓存 */
function collectAllAICacheLocal() {
  const aiCache = [];
  const prefixes = [
    { key: storageKey('cc_ai_advice_'), type: 'advice' },
    { key: storageKey('cc_mealplan_'), type: 'mealplan' },
  ];

  for (const { key: prefix, type } of prefixes) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const date = key.replace(prefix, '');
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && cached.data) {
            aiCache.push({ type, date, data: cached.data, savedAt: cached.savedAt || Date.now() });
          }
        } catch (e) { /* skip */ }
      }
    }
  }
  return aiCache;
}

// ═══════════════════════════════════════════════════
// 初始化：同步 + 迁移
// ═══════════════════════════════════════════════════

/**
 * 应用初始化时调用
 * - 有 token：同步 D1 → localStorage，迁移本地数据
 * - 无 token：匿名模式，什么都不做
 */
async function initDB() {
  if (!hasSession()) return;

  // 先尝试迁移本地数据到 D1
  await migrateToServer();

  // 然后从 D1 拉取最新数据更新本地缓存
  await syncFromServer();

  // 处理离线期间积压的同步请求
  await processPendingSync();
}

// ═══════════════════════════════════════════════════
// 网络状态监听
// ═══════════════════════════════════════════════════

window.addEventListener('online', () => {
  if (hasSession()) {
    processPendingSync().then(count => {
      if (count > 0) console.log('Synced', count, 'pending operations');
    });
  }
});
